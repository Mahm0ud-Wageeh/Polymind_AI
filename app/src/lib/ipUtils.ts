/**
 * Pure TypeScript IP math library.
 * Subnet calculations, VLSM planning, CIDR operations — all client-side.
 */

/* ------------------------------------------------------------------ */
/* Parsing & Formatting                                                */
/* ------------------------------------------------------------------ */

export function parseIp(ip: string): number[] {
  return ip.split('.').map(Number)
}

export function ipToNumber(ip: string): number {
  const parts = parseIp(ip)
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join('.')
}

export function isValidIp(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every((p) => {
    const n = Number(p)
    return Number.isInteger(n) && n >= 0 && n <= 255
  })
}

export function isValidCidr(cidr: string): boolean {
  const parts = cidr.split('/')
  if (parts.length !== 2) return false
  const prefix = Number(parts[1])
  return isValidIp(parts[0]) && Number.isInteger(prefix) && prefix >= 0 && prefix <= 32
}

/* ------------------------------------------------------------------ */
/* CIDR ↔ Mask Conversions                                             */
/* ------------------------------------------------------------------ */

export function cidrToMask(prefix: number): string {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  return numberToIp(mask)
}

export function maskToCidr(mask: string): number {
  const num = ipToNumber(mask)
  let bits = 0
  let checking = true
  for (let i = 31; i >= 0; i--) {
    if ((num >>> i) & 1) {
      if (!checking) return -1 // invalid mask
      bits++
    } else {
      checking = false
    }
  }
  return bits
}

export function cidrToWildcard(prefix: number): string {
  const mask = prefix === 0 ? 0xffffffff : ~((0xffffffff << (32 - prefix)) >>> 0) >>> 0
  return numberToIp(mask)
}

/* ------------------------------------------------------------------ */
/* Subnet Calculation                                                  */
/* ------------------------------------------------------------------ */

export interface SubnetInfo {
  network: string
  broadcast: string
  gateway: string
  hostMin: string
  hostMax: string
  mask: string
  wildcard: string
  prefix: number
  totalHosts: number
  usableHosts: number
  ipClass: string
  isPrivate: boolean
  binaryMask: string
}

export function calculateSubnet(ip: string, prefix: number): SubnetInfo {
  const ipNum = ipToNumber(ip)
  const maskNum = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const networkNum = (ipNum & maskNum) >>> 0
  const broadcastNum = (networkNum | ~maskNum) >>> 0
  const totalHosts = Math.pow(2, 32 - prefix)
  const usableHosts = prefix <= 30 ? totalHosts - 2 : prefix === 31 ? 2 : 1

  const network = numberToIp(networkNum)
  const broadcast = numberToIp(broadcastNum)
  const gateway = prefix <= 30 ? numberToIp(networkNum + 1) : network
  const hostMin = prefix <= 30 ? numberToIp(networkNum + 1) : network
  const hostMax = prefix <= 30 ? numberToIp(broadcastNum - 1) : broadcast

  const firstOctet = (ipNum >>> 24) & 0xff
  let ipClass = 'A'
  if (firstOctet >= 240) ipClass = 'E'
  else if (firstOctet >= 224) ipClass = 'D'
  else if (firstOctet >= 192) ipClass = 'C'
  else if (firstOctet >= 128) ipClass = 'B'

  const isPrivate =
    (firstOctet === 10) ||
    (firstOctet === 172 && ((ipNum >>> 16) & 0xff) >= 16 && ((ipNum >>> 16) & 0xff) <= 31) ||
    (firstOctet === 192 && ((ipNum >>> 16) & 0xff) === 168)

  const binaryMask = maskNum.toString(2).padStart(32, '0').replace(/(.{8})/g, '$1.').slice(0, -1)

  return {
    network,
    broadcast,
    gateway,
    hostMin,
    hostMax,
    mask: cidrToMask(prefix),
    wildcard: cidrToWildcard(prefix),
    prefix,
    totalHosts,
    usableHosts,
    ipClass,
    isPrivate,
    binaryMask,
  }
}

/* ------------------------------------------------------------------ */
/* VLSM Allocation                                                     */
/* ------------------------------------------------------------------ */

export interface VlsmAllocation {
  name: string
  requiredHosts: number
  allocatedPrefix: number
  network: string
  broadcast: string
  gateway: string
  hostMin: string
  hostMax: string
  mask: string
  usableHosts: number
  waste: number
}

/**
 * Allocate subnets using Variable Length Subnet Masking.
 * Sorts requirements by size (largest first) and allocates from base network.
 */
export function vlsmAllocate(
  baseNetwork: string,
  basePrefix: number,
  requirements: Array<{ name: string; hosts: number }>
): { allocations: VlsmAllocation[]; totalWaste: number; error?: string } {
  // Sort by host count descending
  const sorted = [...requirements].sort((a, b) => b.hosts - a.hosts)

  const allocations: VlsmAllocation[] = []
  let currentAddress = ipToNumber(baseNetwork)
  const baseEnd = (ipToNumber(baseNetwork) | ~((0xffffffff << (32 - basePrefix)) >>> 0)) >>> 0

  for (const req of sorted) {
    // Find smallest prefix that fits
    const neededHosts = req.hosts + 2 // network + broadcast
    let prefix = 32
    while (prefix > 0 && Math.pow(2, 32 - prefix) < neededHosts) {
      prefix--
    }

    // Align to subnet boundary
    const subnetSize = Math.pow(2, 32 - prefix)
    const alignedAddress = Math.ceil(currentAddress / subnetSize) * subnetSize

    if (alignedAddress + subnetSize - 1 > baseEnd) {
      return {
        allocations,
        totalWaste: 0,
        error: `Not enough address space for "${req.name}" (needs ${req.hosts} hosts)`,
      }
    }

    const subnet = calculateSubnet(numberToIp(alignedAddress >>> 0), prefix)
    const usable = subnet.usableHosts

    allocations.push({
      name: req.name,
      requiredHosts: req.hosts,
      allocatedPrefix: prefix,
      network: subnet.network,
      broadcast: subnet.broadcast,
      gateway: subnet.gateway,
      hostMin: subnet.hostMin,
      hostMax: subnet.hostMax,
      mask: subnet.mask,
      usableHosts: usable,
      waste: usable - req.hosts,
    })

    currentAddress = alignedAddress + subnetSize
  }

  const totalWaste = allocations.reduce((sum, a) => sum + a.waste, 0)

  return { allocations, totalWaste }
}

/* ------------------------------------------------------------------ */
/* IP Range Utilities                                                  */
/* ------------------------------------------------------------------ */

export function ipRange(start: string, end: string): string[] {
  const startNum = ipToNumber(start)
  const endNum = ipToNumber(end)
  const result: string[] = []
  for (let i = startNum; i <= endNum && result.length < 256; i++) {
    result.push(numberToIp(i))
  }
  return result
}

export function isIpInSubnet(ip: string, network: string, prefix: number): boolean {
  const ipNum = ipToNumber(ip)
  const netNum = ipToNumber(network)
  const maskNum = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  return (ipNum & maskNum) === (netNum & maskNum)
}

export function subnetsOverlap(
  net1: string, prefix1: number,
  net2: string, prefix2: number
): boolean {
  const smaller = Math.min(prefix1, prefix2)
  const mask = smaller === 0 ? 0 : (0xffffffff << (32 - smaller)) >>> 0
  return (ipToNumber(net1) & mask) === (ipToNumber(net2) & mask)
}

/* ------------------------------------------------------------------ */
/* Display Helpers                                                     */
/* ------------------------------------------------------------------ */

export function formatSubnetSummary(info: SubnetInfo): string {
  return `${info.network}/${info.prefix} (${info.usableHosts.toLocaleString()} usable hosts)`
}

export const COMMON_SUBNETS = [
  { prefix: 8, mask: '255.0.0.0', hosts: 16777214, label: '/8 — Class A' },
  { prefix: 16, mask: '255.255.0.0', hosts: 65534, label: '/16 — Class B' },
  { prefix: 20, mask: '255.255.240.0', hosts: 4094, label: '/20' },
  { prefix: 21, mask: '255.255.248.0', hosts: 2046, label: '/21' },
  { prefix: 22, mask: '255.255.252.0', hosts: 1022, label: '/22' },
  { prefix: 23, mask: '255.255.254.0', hosts: 510, label: '/23' },
  { prefix: 24, mask: '255.255.255.0', hosts: 254, label: '/24 — Class C' },
  { prefix: 25, mask: '255.255.255.128', hosts: 126, label: '/25' },
  { prefix: 26, mask: '255.255.255.192', hosts: 62, label: '/26' },
  { prefix: 27, mask: '255.255.255.224', hosts: 30, label: '/27' },
  { prefix: 28, mask: '255.255.255.240', hosts: 14, label: '/28' },
  { prefix: 29, mask: '255.255.255.248', hosts: 6, label: '/29' },
  { prefix: 30, mask: '255.255.255.252', hosts: 2, label: '/30 — Point-to-Point' },
  { prefix: 31, mask: '255.255.255.254', hosts: 2, label: '/31 — P2P (RFC 3021)' },
  { prefix: 32, mask: '255.255.255.255', hosts: 1, label: '/32 — Host' },
] as const
