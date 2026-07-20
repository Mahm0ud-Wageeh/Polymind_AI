import { useState } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  FileJson,
  Activity,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { severityColor, severityBg, type ValidationResult } from '@/lib/validationEngine'
import type { NetworkDesignData } from '@/services/networking/designerService'
import { cn } from '@/lib/utils'
import { networkToolsService } from '@/services/networking/networkToolsService'

export default function NetworkValidator() {
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    setError(null)
    setResult(null)

    if (!jsonInput.trim()) {
      setError('Please paste a network design JSON.')
      return
    }

    try {
      const data = JSON.parse(jsonInput) as NetworkDesignData
      if (!data.devices && !data.topology && !data.ipAddressing) {
        throw new Error('JSON does not appear to be a valid Polymind network design.')
      }
      
      setLoading(true)
      const validationResult = await networkToolsService.validate(data)
      setResult({
        ...validationResult,
        timestamp: new Date(),
        issues: validationResult.issues.map((issue, index) => ({
          ...issue,
          id: `issue-${index + 1}`,
          affectedDevices: [],
          autoFixable: false,
          category: issue.category as ValidationResult['issues'][number]['category'],
        })),
      })
    } catch (e) {
      setError(`Could not validate this design: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel: Input */}
      <div className="w-1/2 border-r border-border bg-muted/10 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Network Validator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze network designs for conflicts, missing configs, and security issues.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Paste Network Design JSON
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full flex-1 p-4 font-mono text-xs border border-border rounded-xl bg-card resize-none outline-none focus:border-ring"
            placeholder={'{\n  "devices": [...],\n  "ipAddressing": {...}\n}'}
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 flex items-start gap-2">
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button onClick={() => void handleValidate()} disabled={loading} className="w-full mt-4 gap-2">
          <Activity className="h-4 w-4" />
          {loading ? 'Validating…' : 'Run Validation'}
        </Button>
      </div>

      {/* Right Panel: Results */}
      <div className="w-1/2 bg-card flex flex-col">
        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <ShieldAlert className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">Paste a JSON design and click validate to see issues.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-border bg-background/50 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Validation Report</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Health Score</span>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-bold border",
                    result.score >= 90 ? "bg-success/10 text-success border-success/20" :
                    result.score >= 70 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {Math.round(result.score)} / 100
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-red-500">{result.summary.critical}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Critical</span>
                </div>
                <div className="flex-1 p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-amber-500">{result.summary.warning}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Warnings</span>
                </div>
                <div className="flex-1 p-3 rounded-lg border border-border bg-card flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-blue-500">{result.summary.info}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Info</span>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {result.issues.length === 0 ? (
                  <div className="p-6 rounded-xl border border-success/30 bg-success/5 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="h-10 w-10 text-success mb-3" />
                    <h3 className="font-semibold text-foreground mb-1">Network Design is Valid</h3>
                    <p className="text-sm text-muted-foreground">No conflicts or critical issues found. The design follows standard best practices.</p>
                  </div>
                ) : (
                  result.issues.sort((a, b) => {
                    const order = { critical: 0, warning: 1, info: 2 }
                    return order[a.severity] - order[b.severity]
                  }).map((issue) => (
                    <div key={issue.id} className={cn("p-4 rounded-xl border transition-all hover:shadow-sm", severityBg(issue.severity))}>
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-0.5", severityColor(issue.severity))}>
                          {issue.severity === 'critical' ? <XCircle className="h-5 w-5" /> :
                           issue.severity === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                           <Info className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={cn("text-sm font-semibold mb-1", severityColor(issue.severity))}>
                            {issue.title}
                          </h3>
                          <p className="text-sm text-foreground/80 mb-3">{issue.description}</p>
                          
                          {issue.affectedDevices.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Affected Elements:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {issue.affectedDevices.map(d => (
                                  <span key={d} className="px-2 py-0.5 rounded bg-background border border-border text-xs font-mono">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-2 p-3 rounded-lg bg-background border border-border mt-2">
                            <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-primary mb-0.5">Recommendation</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{issue.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  )
}
