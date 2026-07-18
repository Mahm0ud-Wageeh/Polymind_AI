import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  Network,
  Send,
  Loader2,
  Building2,
  Users,
  Wifi,
  Monitor,
  Camera,
  Radio,
  GitBranch,
  Layers,
  Router,
  Shield,
  Globe,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { designerService, type NetworkDesignRequest, type NetworkDesignData } from '@/services/networking/designerService'
import { Logo } from '@/components/shell/Logo'

interface ToggleOption {
  id: keyof NetworkDesignRequest
  label: string
  icon: typeof Network
}

const toggleOptions: ToggleOption[] = [
  { id: 'dualIsp', label: 'Dual ISP', icon: Globe },
  { id: 'activeDirectory', label: 'AD', icon: Monitor },
  { id: 'voip', label: 'VoIP', icon: Radio },
  { id: 'cctv', label: 'CCTV', icon: Camera },
  { id: 'guestWifi', label: 'Guest WiFi', icon: Wifi },
  { id: 'multipleVlans', label: 'VLANs', icon: Layers },
  { id: 'interVlanRouting', label: 'Inter-VLAN', icon: GitBranch },
  { id: 'ospf', label: 'OSPF', icon: GitBranch },
  { id: 'coreSwitches', label: 'Core SW', icon: Router },
  { id: 'distributionSwitches', label: 'Dist SW', icon: Layers },
  { id: 'accessSwitches', label: 'Access SW', icon: Layers },
  { id: 'dmz', label: 'DMZ', icon: Shield },
  { id: 'firewall', label: 'Firewall', icon: Shield },
]

const examplePrompts = [
  '3 buildings, 500 employees, dual ISP, AD, VoIP, CCTV, OSPF',
  'Campus network with multiple VLANs and guest WiFi',
  'DMZ with firewall, inter-VLAN routing, core/dist/access switches',
]

export default function Designer() {
  const navigate = useNavigate()
  const createConversation = useStore((s) => s.createConversation)

  const [prompt, setPrompt] = useState('')
  const [buildings, setBuildings] = useState(1)
  const [employees, setEmployees] = useState(100)
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<NetworkDesignData | null>(null)

  const toggle = (id: string) => setToggles((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const request: NetworkDesignRequest = {
        prompt: prompt.trim(),
        buildings,
        employees,
        dualIsp: toggles['dualIsp'] ?? false,
        activeDirectory: toggles['activeDirectory'] ?? false,
        voip: toggles['voip'] ?? false,
        cctv: toggles['cctv'] ?? false,
        guestWifi: toggles['guestWifi'] ?? false,
        multipleVlans: toggles['multipleVlans'] ?? false,
        interVlanRouting: toggles['interVlanRouting'] ?? false,
        ospf: toggles['ospf'] ?? false,
        coreSwitches: toggles['coreSwitches'] ?? false,
        distributionSwitches: toggles['distributionSwitches'] ?? false,
        accessSwitches: toggles['accessSwitches'] ?? false,
        dmz: toggles['dmz'] ?? false,
        firewall: toggles['firewall'] ?? false,
      }

      const response = await designerService.generate(request)
      if (response.designData) {
        setResult(response.designData)
      }
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to generate design')
    } finally {
      setLoading(false)
    }
  }, [prompt, buildings, employees, toggles])

  const sendToChat = useCallback(() => {
    createConversation()
    navigate('/workspace')
  }, [createConversation, navigate])

  if (result) {
    return <DesignResult data={result} prompt={prompt} onNewDesign={() => { setResult(null); setError(null) }} onSendToChat={sendToChat} />
  }

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
            AI Network Designer
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Describe the network you need. The AI will generate a complete design with topology,
            devices, IP plan, VLANs, routing, security, and deployment steps.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5 animate-slide-in-bottom">
          {/* Prompt textarea */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Network Requirements</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your network… e.g. 'Create a company network for 500 employees in 3 buildings with dual ISP, VoIP, and guest WiFi'"
              className="w-full h-28 p-3 text-sm border border-border rounded-xl bg-background resize-none outline-none focus:border-ring transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {examplePrompts.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-accent transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Numeric fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Buildings</label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={buildings}
                  onChange={(e) => setBuildings(Number(e.target.value))}
                  className="flex-1 accent-ring"
                />
                <span className="text-sm font-medium w-6 text-right">{buildings}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Employees</label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min={10}
                  max={5000}
                  step={50}
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="flex-1 accent-ring"
                />
                <span className="text-sm font-medium w-12 text-right">{employees}</span>
              </div>
            </div>
          </div>

          {/* Toggle chips */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Features & Requirements</label>
            <div className="flex flex-wrap gap-2">
              {toggleOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(opt.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all',
                    toggles[opt.id]
                      ? 'bg-ring/10 text-ring border-ring/40'
                      : 'bg-muted/50 text-muted-foreground border-border hover:border-ring/30'
                  )}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? 'Designing…' : 'Generate Design'}
            </Button>
            {prompt.trim() && !loading && (
              <span className="text-xs text-muted-foreground">
                Uses GPT-4o-mini
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

/* ------------------------------------------------------------------ */
/* Design Result View
/* ------------------------------------------------------------------ */

import { TopologyCanvas } from '@/components/topology/TopologyCanvas'
import { designToGraph } from '@/components/topology/topologyUtils'

function DesignResult({
  data,
  prompt,
  onNewDesign,
  onSendToChat,
}: {
  data: NetworkDesignData
  prompt: string
  onNewDesign: () => void
  onSendToChat: () => void
}) {
  const [activeTab, setActiveTab] = useState('topology')
  const graph = useMemo(() => designToGraph(data), [data])

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {/* Header (sticky) */}
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-background z-10 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">Network Design</h1>
            <p className="text-sm text-muted-foreground truncate">{prompt}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onNewDesign}>
              New Design
            </Button>
            <Button variant="outline" size="sm" onClick={onSendToChat}>
              <Network className="h-4 w-4 mr-1.5" />
              Discuss in chat
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 sm:px-6 py-2 border-b border-border bg-muted/30 shrink-0">
          <div className="max-w-6xl mx-auto">
            <TabsList className="bg-muted">
              <TabsTrigger value="topology" className="text-xs">Topology Diagram</TabsTrigger>
              <TabsTrigger value="details" className="text-xs">Design Details</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Topology Tab Content */}
        <TabsContent value="topology" className="flex-1 min-h-0 m-0 data-[state=inactive]:hidden border-none p-0 outline-none">
          <TopologyCanvas initialGraph={graph} designData={data} />
        </TabsContent>

        {/* Details Tab Content */}
        <TabsContent value="details" className="flex-1 min-h-0 m-0 data-[state=inactive]:hidden border-none p-0 outline-none">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Summary */}
        {data.summary && (
          <Section title="Summary">
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </Section>
        )}

        {/* Topology */}
        {data.topology && (
          <Section title="Topology">
            <div className="space-y-3">
              {data.topology.layers?.map((layer, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                    {i === 0 ? <Router className="h-4 w-4" /> : i === data.topology.layers.length - 1 ? <Layers className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{layer.name}</p>
                    <p className="text-xs text-muted-foreground">{layer.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {data.topology.connections && data.topology.connections.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Connections</p>
                <div className="space-y-1">
                  {data.topology.connections.map((conn, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{conn.from}</span>
                      <span>⟷</span>
                      <span className="font-medium text-foreground">{conn.to}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full">{conn.medium}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Devices */}
        {data.devices && data.devices.length > 0 && (
          <Section title="Devices">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Model</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Count</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Layer</th>
                  </tr>
                </thead>
                <tbody>
                  {data.devices.map((dev, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 px-2 font-medium">{dev.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{dev.role}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{dev.modelSuggestion}</td>
                      <td className="py-2 px-2 text-center">{dev.count}</td>
                      <td className="py-2 px-2">
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full">{dev.layer}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* IP Addressing */}
        {data.ipAddressing && data.ipAddressing.subnets && data.ipAddressing.subnets.length > 0 && (
          <Section title="IP Addressing">
            <p className="text-xs text-muted-foreground mb-3">Strategy: {data.ipAddressing.strategy}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">VLAN</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Network</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ipAddressing.subnets.map((sub, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 px-2 font-mono text-xs">{sub.vlanId}</td>
                      <td className="py-2 px-2">{sub.name}</td>
                      <td className="py-2 px-2 font-mono text-xs text-muted-foreground">{sub.network}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{sub.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* VLAN Plan */}
        {data.vlanPlan && data.vlanPlan.length > 0 && (
          <Section title="VLAN Plan">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">ID</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Subnet</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vlanPlan.map((vlan) => (
                    <tr key={vlan.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-2 font-mono text-xs">{vlan.id}</td>
                      <td className="py-2 px-2 font-medium">{vlan.name}</td>
                      <td className="py-2 px-2 font-mono text-xs text-muted-foreground">{vlan.subnet}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{vlan.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Routing Plan */}
        {data.routingPlan && (
          <Section title="Routing">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Protocol: {data.routingPlan.protocol}</span>
              </div>
              {data.routingPlan.areas && data.routingPlan.areas.length > 0 && (
                <div className="ml-6 space-y-1">
                  {data.routingPlan.areas.map((area, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-ring shrink-0" />
                      {area}
                    </div>
                  ))}
                </div>
              )}
              {data.routingPlan.details && (
                <p className="text-xs text-muted-foreground leading-relaxed">{data.routingPlan.details}</p>
              )}
            </div>
          </Section>
        )}

        {/* Security */}
        {data.security && (
          <Section title="Security">
            <div className="space-y-3">
              {data.security.firewall && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Firewall</p>
                  <p className="text-xs text-muted-foreground">{data.security.firewall}</p>
                </div>
              )}
              {data.security.dmz && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">DMZ</p>
                  <p className="text-xs text-muted-foreground">{data.security.dmz}</p>
                </div>
              )}
              {data.security.acls && data.security.acls.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">ACL Recommendations</p>
                  <ul className="space-y-1">
                    {data.security.acls.map((acl, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{acl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Deployment Plan */}
        {data.deploymentPlan && data.deploymentPlan.length > 0 && (
          <Section title="Deployment Plan">
            <div className="space-y-4">
              {data.deploymentPlan.map((phase, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-border last:border-l-2">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-ring ring-2 ring-background" />
                  <p className="text-sm font-medium mb-1">{phase.phase}</p>
                  <ul className="space-y-1">
                    {phase.tasks.map((task, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-success" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Rack Recommendations */}
        {data.rackRecommendations && data.rackRecommendations.length > 0 && (
          <Section title="Rack Recommendations">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Unit</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rackRecommendations.map((rack, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 px-2 font-mono text-xs">{rack.unit}</td>
                      <td className="py-2 px-2 text-xs">{rack.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section wrapper
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 animate-slide-in-bottom">
      <h2 className="text-base font-semibold mb-3 tracking-tight">{title}</h2>
      {children}
    </div>
  )
}