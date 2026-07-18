import { useState } from 'react'
import {
  Wrench,
  Search,
  AlertOctagon,
  FileText,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { troubleshootService, type TroubleshootRequest, type TroubleshootResponse } from '@/services/networking/troubleshootService'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const INPUT_TYPES = [
  { id: 'log', label: 'Syslog / Error Log', icon: FileText },
  { id: 'show_command', label: 'Show Command Output', icon: Terminal },
  { id: 'config', label: 'Configuration File', icon: FileText },
  { id: 'packet_tracer', label: 'Packet Tracer Issue', icon: Activity },
  { id: 'other', label: 'Other', icon: Search },
] as const

export default function Troubleshooter() {
  const [inputType, setInputType] = useState<TroubleshootRequest['type']>('log')
  const [inputContent, setInputContent] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TroubleshootResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAnalyze = async () => {
    if (!inputContent.trim()) {
      setError('Please provide the logs, configuration, or show command output to analyze.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await troubleshootService.analyze({
        type: inputType,
        input: inputContent,
        context: context.trim() ? context : undefined
      })
      setResult(res)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyFix = () => {
    if (!result?.fixCommands) return
    navigator.clipboard.writeText(result.fixCommands)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getSeverityColors = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/30'
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel: Input */}
      <div className="w-1/2 border-r border-border bg-muted/10 p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            AI Troubleshooter
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Paste error logs, configurations, or show commands to get AI-powered root cause analysis and fixes.
          </p>
        </div>

        <div className="flex-1 flex flex-col min-h-0 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Issue Type</label>
            <div className="flex flex-wrap gap-2">
              {INPUT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setInputType(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    inputType === t.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:bg-accent text-muted-foreground'
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Content (Logs, Config, Output)
            </label>
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              className="w-full flex-1 p-3 font-mono text-xs border border-border rounded-lg bg-card resize-none outline-none focus:border-ring leading-relaxed"
              placeholder="Paste the output of 'show ip ospf neighbor', error syslog messages, or the configuration snippet here..."
              spellCheck={false}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Symptoms / Context (Optional)</label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full p-2.5 text-sm border border-border rounded-lg bg-card outline-none focus:border-ring"
              placeholder="e.g., 'Users in VLAN 10 cannot reach the internet since the weekend switch reload.'"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 flex items-start gap-2">
            <AlertOctagon className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button onClick={handleAnalyze} disabled={loading} className="w-full mt-4 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Analyzing...' : 'Analyze Issue'}
        </Button>
      </div>

      {/* Right Panel: Results */}
      <div className="w-1/2 bg-card flex flex-col">
        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <Wrench className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">Provide input on the left and click Analyze to view the root cause and fix.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Root Cause Analysis
                  </h2>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {result.rootCause}
                  </p>
                </div>
                <div className={cn("px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shrink-0", getSeverityColors(result.severity))}>
                  {result.severity}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Detailed Explanation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {result.explanation}
                </p>
              </div>

              {result.fixCommands && result.fixCommands !== 'N/A' && result.fixCommands.trim() !== '' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-success" />
                      Resolution CLI Commands
                    </h3>
                    <Button variant="outline" size="sm" onClick={handleCopyFix} className="h-7 text-xs px-2">
                      {copied ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copied ? 'Copied' : 'Copy Fix'}
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    language="bash"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '13px', backgroundColor: '#0d1117', border: '1px solid var(--tw-colors-border)' }}
                  >
                    {result.fixCommands}
                  </SyntaxHighlighter>
                </div>
              )}

              {result.bestPractices && result.bestPractices.length > 0 && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Best Practice Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {result.bestPractices.map((bp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-success/70" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
