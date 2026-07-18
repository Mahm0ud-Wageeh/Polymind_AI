import { useState } from 'react'
import {
  Terminal,
  Server,
  Layers,
  Shield,
  Loader2,
  Copy,
  CheckCircle2,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ciscoCliService, type CiscoCliRequest } from '@/services/networking/ciscoCliService'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const DEVICE_TYPES = [
  { id: 'router', label: 'Router', icon: Server },
  { id: 'l3-switch', label: 'L3 Switch', icon: Layers },
  { id: 'l2-switch', label: 'L2 Switch', icon: Layers },
  { id: 'firewall', label: 'Firewall', icon: Shield },
]

const PLATFORMS = [
  { id: 'ios', label: 'Cisco IOS' },
  { id: 'ios-xe', label: 'Cisco IOS-XE' },
  { id: 'asa', label: 'Cisco ASA' },
]

const FEATURE_CATEGORIES = [
  {
    id: 'basic',
    label: 'Basic Configuration',
    features: [
      { id: 'hostname', label: 'Hostname' },
      { id: 'banner', label: 'Banner MOTD' },
      { id: 'ssh', label: 'SSH & VTY Access' },
      { id: 'ntp', label: 'NTP Client' },
      { id: 'syslog', label: 'Syslog Logging' },
      { id: 'snmp', label: 'SNMPv3' },
    ],
  },
  {
    id: 'l2',
    label: 'Layer 2 Features',
    features: [
      { id: 'vlans', label: 'VLANs' },
      { id: 'trunks', label: 'Trunk Ports' },
      { id: 'access', label: 'Access Ports' },
      { id: 'port-security', label: 'Port Security' },
      { id: 'stp', label: 'Spanning Tree (RSTP)' },
      { id: 'etherchannel', label: 'EtherChannel (LACP)' },
    ],
  },
  {
    id: 'l3',
    label: 'Layer 3 Features',
    features: [
      { id: 'interfaces', label: 'IP Interfaces' },
      { id: 'dhcp', label: 'DHCP Server' },
      { id: 'nat', label: 'NAT/PAT' },
      { id: 'static-routes', label: 'Static Routes' },
      { id: 'default-route', label: 'Default Route' },
    ],
  },
  {
    id: 'routing',
    label: 'Routing Protocols',
    features: [
      { id: 'ospf', label: 'OSPFv2' },
      { id: 'eigrp', label: 'EIGRP' },
      { id: 'bgp', label: 'BGP' },
      { id: 'hsrp', label: 'HSRP (FHRP)' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    features: [
      { id: 'acl', label: 'Access Control Lists (ACL)' },
      { id: 'aaa', label: 'AAA (TACACS+/RADIUS)' },
      { id: 'hardening', label: 'Device Hardening' },
    ],
  },
]

export default function CiscoCliGenerator() {
  const [deviceType, setDeviceType] = useState('router')
  const [platform, setPlatform] = useState('ios-xe')
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set(['hostname', 'ssh']))
  const [parameters, setParameters] = useState<string>('{\n  "hostname": "R1-CORE",\n  "domain_name": "example.com"\n}')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ config: string; explanation: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleFeature = (id: string) => {
    const next = new Set(selectedFeatures)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedFeatures(next)
  }

  const handleGenerate = async () => {
    if (selectedFeatures.size === 0) {
      setError('Please select at least one feature.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let parsedParams = {}
      try {
        if (parameters.trim()) {
          parsedParams = JSON.parse(parameters)
        }
      } catch {
        throw new Error('Invalid JSON parameters format.')
      }

      const req: CiscoCliRequest = {
        deviceType,
        platform,
        features: Array.from(selectedFeatures),
        parameters: parsedParams,
      }

      const res = await ciscoCliService.generate(req)
      setResult({ config: res.configuration, explanation: res.explanation })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.config)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result.config], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deviceType}-${platform}-config.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel: Configuration Form */}
      <ScrollArea className="w-1/2 border-r border-border bg-muted/10 p-6">
        <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Terminal className="h-6 w-6 text-primary" />
              Cisco CLI Generator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select device capabilities and generate production-ready configurations.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Device Type</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DEVICE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDeviceType(t.id)}
                    className={cn(
                      'flex flex-col items-center justify-center p-3 rounded-lg border text-xs gap-2 transition-all',
                      deviceType === t.id
                        ? 'border-primary bg-primary/10 text-primary font-medium shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-accent'
                    )}
                  >
                    <t.icon className="h-5 w-5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Platform / OS</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      platform === p.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:bg-accent'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium block">Features & Services</label>
            <div className="space-y-6">
              {FEATURE_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">{cat.label}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.features.map((f) => {
                      const isSelected = selectedFeatures.has(f.id)
                      return (
                        <label
                          key={f.id}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                            isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:bg-accent'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFeature(f.id)}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span className="text-xs select-none">{f.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Variables / Parameters (JSON)</label>
            <p className="text-xs text-muted-foreground mb-2">Optional specific values you want to use (e.g. IPs, VLAN IDs).</p>
            <textarea
              value={parameters}
              onChange={(e) => setParameters(e.target.value)}
              className="w-full h-32 p-3 font-mono text-xs border border-border rounded-lg bg-card resize-none outline-none focus:border-ring"
              placeholder='{\n  "vlan_10_ip": "10.0.10.1",\n  "ospf_area": "0"\n}'
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
            {loading ? 'Generating Configuration...' : 'Generate CLI'}
          </Button>
        </div>
      </ScrollArea>

      {/* Right Panel: Result */}
      <div className="w-1/2 flex flex-col bg-card">
        {result ? (
          <>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-sm font-medium">Generated Configuration</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 px-2 text-xs">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 px-2 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4">
                <SyntaxHighlighter
                  language="bash"
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '13px', backgroundColor: 'var(--tw-colors-gray-950)' }}
                  showLineNumbers
                >
                  {result.config}
                </SyntaxHighlighter>

                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    AI Explanation
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-pulse">
            <Terminal className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">Select features and click Generate to view configuration.</p>
          </div>
        )}
      </div>
    </div>
  )
}
