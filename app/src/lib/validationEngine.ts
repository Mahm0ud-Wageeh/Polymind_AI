/**
 * Network Validation Engine — client-side analysis of network designs.
 * Detects issues like duplicate IPs, subnet overlaps, disconnected devices,
 * VLAN mismatches, and missing configurations.
 */

import { subnetsOverlap } from './ipUtils'
import type { NetworkDesignData } from '@/services/networking/designerService'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type IssueSeverity = 'critical' | 'warning' | 'info'
export type IssueCategory =
  | 'ip_conflict'
  | 'subnet'
  | 'gateway'
  | 'routing'
  | 'vlan'
  | 'connectivity'
  | 'security'
  | 'interface'
  | 'loop'
  | 'best_practice'

export interface ValidationIssue {
  id: string
  severity: IssueSeverity
  category: IssueCategory
  title: string
  description: string
  affectedDevices: string[]
  suggestion: string
  autoFixable: boolean
}

export interface ValidationResult {
  issues: ValidationIssue[]
  score: number // 0-100 health score
  summary: {
    critical: number
    warning: number
    info: number
    total: number
  }
  timestamp: Date
}

/* ------------------------------------------------------------------ */
/* Main Validator                                                      */
/* ------------------------------------------------------------------ */

let issueCounter = 0
function nextId(): string {
  return `issue-${++issueCounter}`
}

export function validateNetworkDesign(data: NetworkDesignData): ValidationResult {
  issueCounter = 0
  const issues: ValidationIssue[] = []

  // Run all checks
  issues.push(...checkDuplicateIps(data))
  issues.push(...checkSubnetOverlaps(data))
  issues.push(...checkMissingGateways(data))
  issues.push(...checkVlanConsistency(data))
  issues.push(...checkDisconnectedDevices(data))
  issues.push(...checkRoutingConfiguration(data))
  issues.push(...checkSecurityIssues(data))
  issues.push(...checkBestPractices(data))

  const summary = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
    total: issues.length,
  }

  // Health score: 100 - (critical * 15 + warning * 5 + info * 1), clamped to 0-100
  const score = Math.max(0, Math.min(100, 100 - summary.critical * 15 - summary.warning * 5 - summary.info * 1))

  return { issues, score, summary, timestamp: new Date() }
}

/* ------------------------------------------------------------------ */
/* Check: Duplicate IPs                                                */
/* ------------------------------------------------------------------ */

function checkDuplicateIps(data: NetworkDesignData): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const ipMap = new Map<string, string[]>()

  // Collect IPs from subnets (gateways)
  if (data.ipAddressing?.subnets) {
    for (const subnet of data.ipAddressing.subnets) {
      if (subnet.network) {
        // Extract gateway from network (typically .1)
        const parts = subnet.network.split('/')
        const base = parts[0]
        if (base) {
          const gateway = base.replace(/\.\d+$/, '.1')
          const existing = ipMap.get(gateway) || []
          existing.push(`${subnet.name} gateway`)
          ipMap.set(gateway, existing)
        }
      }
    }
  }

  // Find duplicates
  for (const [ip, owners] of ipMap) {
    if (owners.length > 1) {
      issues.push({
        id: nextId(),
        severity: 'critical',
        category: 'ip_conflict',
        title: `Duplicate IP Address: ${ip}`,
        description: `The IP address ${ip} is assigned to multiple interfaces: ${owners.join(', ')}`,
        affectedDevices: owners,
        suggestion: `Reassign one of the conflicting interfaces to a unique IP address within the subnet.`,
        autoFixable: false,
      })
    }
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Check: Subnet Overlaps                                              */
/* ------------------------------------------------------------------ */

function checkSubnetOverlaps(data: NetworkDesignData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!data.ipAddressing?.subnets || data.ipAddressing.subnets.length < 2) return issues

  const subnets = data.ipAddressing.subnets
    .filter((s) => s.network)
    .map((s) => {
      const parts = s.network.split('/')
      const prefix = parts[1] ? Number(parts[1]) : 24
      return { name: s.name, network: parts[0], prefix }
    })

  for (let i = 0; i < subnets.length; i++) {
    for (let j = i + 1; j < subnets.length; j++) {
      try {
        if (subnetsOverlap(subnets[i].network, subnets[i].prefix, subnets[j].network, subnets[j].prefix)) {
          issues.push({
            id: nextId(),
            severity: 'critical',
            category: 'subnet',
            title: `Subnet Overlap: ${subnets[i].name} ↔ ${subnets[j].name}`,
            description: `${subnets[i].network}/${subnets[i].prefix} overlaps with ${subnets[j].network}/${subnets[j].prefix}`,
            affectedDevices: [subnets[i].name, subnets[j].name],
            suggestion: `Reassign one of the overlapping subnets to a non-overlapping address range.`,
            autoFixable: false,
          })
        }
      } catch {
        // Skip invalid entries
      }
    }
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Check: Missing Gateways                                             */
/* ------------------------------------------------------------------ */

function checkMissingGateways(data: NetworkDesignData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (data.ipAddressing?.subnets) {
    for (const subnet of data.ipAddressing.subnets) {
      if (!subnet.network) {
        issues.push({
          id: nextId(),
          severity: 'warning',
          category: 'gateway',
          title: `Missing Network Address: ${subnet.name}`,
          description: `VLAN/Subnet "${subnet.name}" has no network address configured.`,
          affectedDevices: [subnet.name],
          suggestion: `Assign a network address with appropriate CIDR prefix to this subnet.`,
          autoFixable: false,
        })
      }
    }
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Check: VLAN Consistency                                             */
/* ------------------------------------------------------------------ */

function checkVlanConsistency(data: NetworkDesignData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!data.vlanPlan || data.vlanPlan.length === 0) {
    if (data.ipAddressing?.subnets && data.ipAddressing.subnets.length > 1) {
      issues.push({
        id: nextId(),
        severity: 'warning',
        category: 'vlan',
        title: 'No VLAN Plan Defined',
        description: 'Multiple subnets exist but no VLAN plan is configured. This may cause broadcast domain issues.',
        affectedDevices: [],
        suggestion: 'Create a VLAN plan mapping each subnet to a unique VLAN ID.',
        autoFixable: false,
      })
    }
    return issues
  }

  // Check for duplicate VLAN IDs
  const vlanIds = new Map<number, string[]>()
  for (const vlan of data.vlanPlan) {
    const existing = vlanIds.get(vlan.id) || []
    existing.push(vlan.name)
    vlanIds.set(vlan.id, existing)
  }

  for (const [id, names] of vlanIds) {
    if (names.length > 1) {
      issues.push({
        id: nextId(),
        severity: 'critical',
        category: 'vlan',
        title: `Duplicate VLAN ID: ${id}`,
        description: `VLAN ID ${id} is used by multiple VLANs: ${names.join(', ')}`,
        affectedDevices: names,
        suggestion: `Assign unique VLAN IDs to each VLAN.`,
        autoFixable: false,
      })
    }
  }

  // Check VLAN 1 usage
  const usesVlan1 = data.vlanPlan.some((v) => v.id === 1 && v.purpose && !v.purpose.toLowerCase().includes('native'))
  if (usesVlan1) {
    issues.push({
      id: nextId(),
      severity: 'warning',
      category: 'security',
      title: 'VLAN 1 Used for Traffic',
      description: 'VLAN 1 is the default VLAN and should not carry user traffic for security reasons.',
      affectedDevices: ['VLAN 1'],
      suggestion: 'Move user traffic to a dedicated VLAN and leave VLAN 1 unused or as native only.',
      autoFixable: false,
    })
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Check: Disconnected Devices                                         */
/* ------------------------------------------------------------------ */

function checkDisconnectedDevices(data: NetworkDesignData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!data.topology?.connections || !data.devices) return issues

  const connectedDevices = new Set<string>()
  for (const conn of data.topology.connections) {
    connectedDevices.add(conn.from?.toLowerCase())
    connectedDevices.add(conn.to?.toLowerCase())
  }

  for (const device of data.devices) {
    if (!connectedDevices.has(device.name?.toLowerCase())) {
      issues.push({
        id: nextId(),
        severity: 'warning',
        category: 'connectivity',
        title: `Disconnected Device: ${device.name}`,
        description: `${device.name} (${device.role}) has no connections in the topology.`,
        affectedDevices: [device.name],
        suggestion: `Add connections from ${device.name} to the appropriate upstream device.`,
        autoFixable: false,
      })
    }
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Check: Routing Configuration                                        */
/* ------------------------------------------------------------------ */

function checkRoutingConfiguration(data: NetworkDesignData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check if routing exists when multiple subnets are present
  if (data.ipAddressing?.subnets && data.ipAddressing.subnets.length > 1 && !data.routingPlan) {
    issues.push({
      id: nextId(),
      severity: 'critical',
      category: 'routing',
      title: 'No Routing Protocol Configured',
      description: 'Multiple subnets exist but no routing protocol is configured. Inter-subnet communication will fail.',
      affectedDevices: [],
      suggestion: 'Configure a routing protocol (OSPF recommended for enterprise) or static routes.',
      autoFixable: false,
    })
  }

  // Check OSPF areas if OSPF is used
  if (data.routingPlan?.protocol?.toLowerCase().includes('ospf')) {
    if (!data.routingPlan.areas || data.routingPlan.areas.length === 0) {
      issues.push({
        id: nextId(),
        severity: 'warning',
        category: 'routing',
        title: 'OSPF: No Areas Defined',
        description: 'OSPF is configured but no areas are defined. All networks will be in Area 0.',
        affectedDevices: [],
        suggestion: 'Define OSPF areas for better scalability. At minimum, configure Area 0 (backbone).',
        autoFixable: false,
      })
    }
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Check: Security Issues                                              */
/* ------------------------------------------------------------------ */

function checkSecurityIssues(data: NetworkDesignData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check if firewall exists
  if (!data.security?.firewall && data.devices?.some((d) => d.type?.toLowerCase().includes('router'))) {
    issues.push({
      id: nextId(),
      severity: 'warning',
      category: 'security',
      title: 'No Firewall Configured',
      description: 'The network has routers but no firewall is configured for perimeter security.',
      affectedDevices: [],
      suggestion: 'Add a firewall device between the internal network and the Internet/WAN.',
      autoFixable: false,
    })
  }

  // Check ACLs
  if (!data.security?.acls || data.security.acls.length === 0) {
    issues.push({
      id: nextId(),
      severity: 'info',
      category: 'security',
      title: 'No ACLs Defined',
      description: 'No access control lists are defined. All traffic between subnets will be permitted.',
      affectedDevices: [],
      suggestion: 'Define ACLs to restrict traffic between VLANs and control access to sensitive resources.',
      autoFixable: false,
    })
  }

  // Check DMZ
  if (data.devices?.some((d) => d.role?.toLowerCase().includes('server')) && !data.security?.dmz) {
    issues.push({
      id: nextId(),
      severity: 'info',
      category: 'security',
      title: 'No DMZ for Servers',
      description: 'Servers are present but no DMZ is configured for public-facing services.',
      affectedDevices: data.devices.filter((d) => d.role?.toLowerCase().includes('server')).map((d) => d.name),
      suggestion: 'Place public-facing servers in a DMZ with appropriate firewall rules.',
      autoFixable: false,
    })
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Check: Best Practices                                               */
/* ------------------------------------------------------------------ */

function checkBestPractices(data: NetworkDesignData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check for redundancy
  const routers = data.devices?.filter((d) => d.type?.toLowerCase().includes('router')) ?? []
  if (routers.length === 1) {
    issues.push({
      id: nextId(),
      severity: 'info',
      category: 'best_practice',
      title: 'Single Point of Failure: Router',
      description: 'Only one router exists. A failure will disconnect the entire network.',
      affectedDevices: routers.map((r) => r.name),
      suggestion: 'Consider adding a redundant router with HSRP/VRRP for high availability.',
      autoFixable: false,
    })
  }

  // Check for STP if switches exist
  const switches = data.devices?.filter((d) => d.type?.toLowerCase().includes('switch')) ?? []
  if (switches.length > 2 && data.topology?.connections) {
    issues.push({
      id: nextId(),
      severity: 'info',
      category: 'best_practice',
      title: 'Spanning Tree Recommended',
      description: 'Multiple switches detected. Ensure STP/RSTP is properly configured to prevent loops.',
      affectedDevices: switches.map((s) => s.name),
      suggestion: 'Enable Rapid Spanning Tree Protocol (RSTP) on all switches with proper root bridge election.',
      autoFixable: false,
    })
  }

  // Check deployment plan
  if (!data.deploymentPlan || data.deploymentPlan.length === 0) {
    issues.push({
      id: nextId(),
      severity: 'info',
      category: 'best_practice',
      title: 'No Deployment Plan',
      description: 'No phased deployment plan is defined for the network implementation.',
      affectedDevices: [],
      suggestion: 'Create a deployment plan with phases: infrastructure setup, Layer 2, Layer 3, services, and testing.',
      autoFixable: false,
    })
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Severity Helpers                                                    */
/* ------------------------------------------------------------------ */

export function severityColor(severity: IssueSeverity): string {
  switch (severity) {
    case 'critical': return 'text-red-500'
    case 'warning': return 'text-amber-500'
    case 'info': return 'text-blue-500'
  }
}

export function severityBg(severity: IssueSeverity): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/10 border-red-500/30'
    case 'warning': return 'bg-amber-500/10 border-amber-500/30'
    case 'info': return 'bg-blue-500/10 border-blue-500/30'
  }
}
