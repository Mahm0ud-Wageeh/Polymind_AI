import { useState, useMemo } from 'react'
import {
  GitCompare,
  FileMinus,
  FilePlus,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { networkToolsService } from '@/services/networking/networkToolsService'

type DiffPart = { value: string; count: number; added?: boolean; removed?: boolean }

export default function ConfigDiff() {
  const [oldConfig, setOldConfig] = useState('')
  const [newConfig, setNewConfig] = useState('')
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')
  const [diffResult, setDiffResult] = useState<DiffPart[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runDiff = async () => {
    if (!oldConfig.trim() || !newConfig.trim()) {
      setError('Provide both configurations before comparing them.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await networkToolsService.diff(oldConfig, newConfig)
      setDiffResult(response.chunks.map((chunk) => ({
        value: `${chunk.line}\n`, count: 1, added: chunk.type === 'added', removed: chunk.type === 'removed',
      })))
    } catch (cause) {
      setError((cause as Error).message)
      setDiffResult([])
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    let added = 0
    let removed = 0
    let unchanged = 0

    diffResult.forEach(part => {
      const lineCount = part.count || 0
      if (part.added) added += lineCount
      else if (part.removed) removed += lineCount
      else unchanged += lineCount
    })

    return { added, removed, unchanged, total: added + removed + unchanged }
  }, [diffResult])

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-background z-10 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Configuration Diff Engine</h1>
              <p className="text-sm text-muted-foreground">Compare two Cisco configurations to see changes</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button size="sm" onClick={() => void runDiff()} disabled={loading}>{loading ? 'Comparing…' : 'Compare'}</Button>
            <button
              onClick={() => setViewMode('split')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", viewMode === 'split' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", viewMode === 'unified' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Unified View
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Panel: Inputs */}
        <div className="w-1/3 border-r border-border bg-muted/10 p-6 flex flex-col gap-4">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileMinus className="h-4 w-4 text-destructive" />
                Original Configuration
              </label>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setOldConfig('')}>Clear</Button>
            </div>
            <textarea
              value={oldConfig}
              onChange={(e) => setOldConfig(e.target.value)}
              className="w-full flex-1 p-3 font-mono text-xs border border-border rounded-lg bg-card resize-none outline-none focus:border-ring leading-relaxed"
              spellCheck={false}
              placeholder="Paste original configuration here..."
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FilePlus className="h-4 w-4 text-success" />
                New Configuration
              </label>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setNewConfig('')}>Clear</Button>
            </div>
            <textarea
              value={newConfig}
              onChange={(e) => setNewConfig(e.target.value)}
              className="w-full flex-1 p-3 font-mono text-xs border border-border rounded-lg bg-card resize-none outline-none focus:border-ring leading-relaxed"
              spellCheck={false}
              placeholder="Paste new configuration here..."
            />
          </div>
          
          <Button onClick={() => {
            const temp = oldConfig
            setOldConfig(newConfig)
            setNewConfig(temp)
          }} variant="outline" className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Swap Configurations
          </Button>
        </div>

        {/* Right Panel: Diff View */}
        <div className="w-2/3 bg-card flex flex-col">
          {error && <p className="px-6 py-3 text-sm text-destructive border-b border-border">{error}</p>}
          <div className="px-6 py-3 border-b border-border bg-background/50 flex items-center gap-6 shrink-0 text-sm">
            <div className="font-medium text-muted-foreground">Changes:</div>
            <div className="flex items-center gap-2 text-success">
              <span className="font-mono font-bold">+{stats.added}</span> additions
            </div>
            <div className="flex items-center gap-2 text-destructive">
              <span className="font-mono font-bold">-{stats.removed}</span> deletions
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-mono">{stats.unchanged}</span> unchanged lines
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {viewMode === 'unified' ? (
                <div className="font-mono text-[13px] leading-relaxed border border-border rounded-lg bg-[#0d1117] overflow-hidden text-gray-300">
                  {diffResult.map((part, index) => {
                    const bgColor = part.added ? 'bg-success/20' : part.removed ? 'bg-destructive/20' : 'bg-transparent'
                    const textColor = part.added ? 'text-success' : part.removed ? 'text-destructive' : 'text-gray-400'
                    const prefix = part.added ? '+' : part.removed ? '-' : ' '
                    
                    return (
                      <div key={index} className={cn("flex", bgColor)}>
                        <div className="w-10 text-right pr-2 select-none border-r border-border/30 opacity-50 bg-[#161b22] text-xs py-0.5">
                          {/* Line numbers logic can be complex for unified, keeping it simple */}
                        </div>
                        <div className={cn("pl-4 pr-2 py-0.5 whitespace-pre-wrap flex-1", textColor)}>
                          {part.value.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === '')).map((line, i) => (
                            <div key={i} className="flex"><span className="w-4 select-none opacity-70">{prefix}</span>{line}</div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex gap-4 font-mono text-[13px] leading-relaxed h-full">
                  {/* Split View Left */}
                  <div className="flex-1 border border-border rounded-lg bg-[#0d1117] overflow-hidden text-gray-300 flex flex-col">
                    <div className="bg-[#161b22] border-b border-border/30 px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between font-sans">
                      <span>Original</span>
                    </div>
                    <div className="flex-1 overflow-x-auto p-2">
                      {diffResult.map((part, index) => {
                        if (part.added) return null // Don't show additions on the left side of split view
                        
                        const bgColor = part.removed ? 'bg-destructive/20' : 'bg-transparent'
                        const textColor = part.removed ? 'text-destructive' : 'text-gray-400'
                        
                        return (
                          <div key={index} className={cn("whitespace-pre-wrap py-0.5", bgColor, textColor)}>
                            {part.value.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === '')).map((line, i) => (
                              <div key={i}>{line || ' '}</div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Split View Right */}
                  <div className="flex-1 border border-border rounded-lg bg-[#0d1117] overflow-hidden text-gray-300 flex flex-col">
                    <div className="bg-[#161b22] border-b border-border/30 px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between font-sans">
                      <span>New</span>
                    </div>
                    <div className="flex-1 overflow-x-auto p-2">
                      {diffResult.map((part, index) => {
                        if (part.removed) return null // Don't show removals on the right side of split view
                        
                        const bgColor = part.added ? 'bg-success/20' : 'bg-transparent'
                        const textColor = part.added ? 'text-success' : 'text-gray-400'
                        
                        return (
                          <div key={index} className={cn("whitespace-pre-wrap py-0.5", bgColor, textColor)}>
                            {part.value.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === '')).map((line, i) => (
                              <div key={i}>{line || ' '}</div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
