import { useState, useMemo } from 'react'
import {
  Calculator,
  Network,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  LayoutGrid
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  calculateSubnet,
  vlsmAllocate,
  isValidCidr,
  formatSubnetSummary,
  COMMON_SUBNETS,
  type VlsmAllocation
} from '@/lib/ipUtils'

export default function IpPlanner() {
  const [activeTab, setActiveTab] = useState('subnet')
  
  // Subnet Calculator State
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24')
  
  // VLSM Planner State
  const [vlsmBase, setVlsmBase] = useState('10.0.0.0/16')
  const [vlsmReqsText, setVlsmReqsText] = useState('Servers: 100\nUsers: 500\nGuest: 200\nMgmt: 50')
  
  const [copied, setCopied] = useState(false)

  // Subnet Calculation
  const subnetResult = useMemo(() => {
    if (!isValidCidr(cidrInput)) return null
    const [ip, prefix] = cidrInput.split('/')
    try {
      return calculateSubnet(ip, Number(prefix))
    } catch {
      return null
    }
  }, [cidrInput])

  // VLSM Calculation
  const vlsmResult = useMemo(() => {
    if (!isValidCidr(vlsmBase)) return { error: 'Invalid Base CIDR' }
    const reqs = vlsmReqsText.split('\n').filter(r => r.trim() !== '').map((r, i) => {
      const parts = r.split(':')
      const name = parts[0].trim() || `Subnet ${i + 1}`
      const hosts = parseInt(parts[parts.length - 1].trim())
      return { name, hosts: isNaN(hosts) ? 0 : hosts }
    }).filter(r => r.hosts > 0)

    if (reqs.length === 0) return { error: 'Please enter valid requirements (e.g., Name: 100)' }

    const [ip, prefix] = vlsmBase.split('/')
    try {
      return vlsmAllocate(ip, Number(prefix), reqs)
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [vlsmBase, vlsmReqsText])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportCsv = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-background z-10 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">IP Address Planner</h1>
            <p className="text-sm text-muted-foreground">Subnet Calculator & VLSM Planner</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 sm:px-6 py-2 border-b border-border bg-muted/30 shrink-0">
          <div className="max-w-6xl mx-auto">
            <TabsList className="bg-muted">
              <TabsTrigger value="subnet" className="text-xs">Subnet Calculator</TabsTrigger>
              <TabsTrigger value="vlsm" className="text-xs">VLSM Planner</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Subnet Calculator Tab */}
        <TabsContent value="subnet" className="flex-1 min-h-0 m-0 data-[state=inactive]:hidden border-none p-0 outline-none flex">
          <div className="w-1/3 border-r border-border bg-muted/10 p-6 flex flex-col">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network Definition
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">IP Address / Prefix</label>
                <input
                  type="text"
                  value={cidrInput}
                  onChange={(e) => setCidrInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:border-ring font-mono"
                  placeholder="192.168.1.0/24"
                />
              </div>
              <div className="space-y-1 pt-2">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Quick Select</label>
                {COMMON_SUBNETS.filter(s => s.prefix >= 8).map(s => (
                  <button
                    key={s.prefix}
                    onClick={() => setCidrInput(cidrInput.split('/')[0] + '/' + s.prefix)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded border border-transparent hover:border-border hover:bg-accent transition-colors"
                  >
                    <span className="font-mono">/{s.prefix}</span>
                    <span className="text-muted-foreground">{s.mask}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-card p-6 overflow-y-auto">
            {subnetResult ? (
              <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{formatSubnetSummary(subnetResult)}</h2>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(subnetResult, null, 2))}>
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    Copy JSON
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InfoCard label="Network Address" value={subnetResult.network} copyable />
                  <InfoCard label="Broadcast Address" value={subnetResult.broadcast} copyable />
                  <InfoCard label="Subnet Mask" value={subnetResult.mask} copyable />
                  <InfoCard label="Wildcard Mask" value={subnetResult.wildcard} copyable />
                  <InfoCard label="First Usable Host" value={subnetResult.hostMin} copyable />
                  <InfoCard label="Last Usable Host" value={subnetResult.hostMax} copyable />
                  <InfoCard label="Total Hosts" value={subnetResult.totalHosts.toLocaleString()} />
                  <InfoCard label="Usable Hosts" value={subnetResult.usableHosts.toLocaleString()} />
                  <InfoCard label="IP Class" value={`Class ${subnetResult.ipClass}`} />
                  <InfoCard label="Type" value={subnetResult.isPrivate ? 'Private (RFC 1918)' : 'Public'} />
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Binary Subnet Mask</label>
                  <p className="font-mono text-sm tracking-wider">{subnetResult.binaryMask}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-3 opacity-20" />
                <p>Enter a valid CIDR notation (e.g., 192.168.1.0/24) to see results.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* VLSM Planner Tab */}
        <TabsContent value="vlsm" className="flex-1 min-h-0 m-0 data-[state=inactive]:hidden border-none p-0 outline-none flex">
          <div className="w-1/3 border-r border-border bg-muted/10 p-6 flex flex-col">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              VLSM Requirements
            </h2>
            <div className="space-y-4 flex-1 flex flex-col">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Major Network (CIDR)</label>
                <input
                  type="text"
                  value={vlsmBase}
                  onChange={(e) => setVlsmBase(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:border-ring font-mono"
                  placeholder="10.0.0.0/16"
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex-shrink-0">
                  Subnets (Name: Hosts)
                </label>
                <textarea
                  value={vlsmReqsText}
                  onChange={(e) => setVlsmReqsText(e.target.value)}
                  className="w-full flex-1 p-3 text-sm border border-border rounded-lg bg-card resize-none outline-none focus:border-ring font-mono"
                  placeholder="HR: 50\nIT: 120"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 bg-card p-6 overflow-y-auto">
            {vlsmResult?.error ? (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
                <p className="font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4" /> VLSM Error</p>
                <p className="mt-1">{vlsmResult.error}</p>
              </div>
            ) : vlsmResult && !('error' in vlsmResult) && vlsmResult.allocations && vlsmResult.allocations.length > 0 ? (
              <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">VLSM Allocation Table</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const header = 'Name,Required,Allocated,Network,Mask,Gateway,Host Min,Host Max,Waste\n'
                      const rows = vlsmResult.allocations.map((a: VlsmAllocation) => 
                        `${a.name},${a.requiredHosts},${a.usableHosts},${a.network}/${a.allocatedPrefix},${a.mask},${a.gateway},${a.hostMin},${a.hostMax},${a.waste}`
                      ).join('\n')
                      exportCsv(header + rows, 'vlsm-plan.csv')
                    }}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Export CSV
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium text-right">Req.</th>
                        <th className="px-4 py-3 font-medium text-right">Alloc.</th>
                        <th className="px-4 py-3 font-medium">Network / Mask</th>
                        <th className="px-4 py-3 font-medium">Range (Gateway - Last)</th>
                        <th className="px-4 py-3 font-medium">Broadcast</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {vlsmResult.allocations.map((alloc: VlsmAllocation, i: number) => (
                        <tr key={i} className="hover:bg-accent/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{alloc.name}</td>
                          <td className="px-4 py-3 text-right">{alloc.requiredHosts.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{alloc.usableHosts.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="text-foreground">{alloc.network}/{alloc.allocatedPrefix}</span><br/>
                            <span className="text-muted-foreground text-[10px]">{alloc.mask}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {alloc.gateway} - {alloc.hostMax}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{alloc.broadcast}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-success"></div> Allocated Efficiency</div>
                  <div>Total IP Waste: <span className="font-mono">{vlsmResult.totalWaste.toLocaleString()}</span> addresses</div>
                </div>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoCard({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)
  const onCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-background flex flex-col justify-center relative group">
      <span className="text-xs font-medium text-muted-foreground mb-1">{label}</span>
      <span className="font-mono text-sm truncate">{value}</span>
      {copyable && (
        <button
          onClick={onCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
          title="Copy"
        >
          {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </div>
  )
}
