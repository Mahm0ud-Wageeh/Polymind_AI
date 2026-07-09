import { useStore } from '@/store/useStore'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Artifact, ProgressStep, ActivityItem } from '@/types'
import {
  X,
  ChevronLeft,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Code,
  FileText,
  Image,
  File,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function RightPanel() {
  const {
    rightPanelOpen,
    toggleRightPanel,
    activePanelTab,
    setActivePanelTab,
    artifacts,
    progressSteps,
    activityItems,
  } = useStore()

  if (!rightPanelOpen) {
    return (
      <div
        className="w-1 border-l border-border bg-background cursor-pointer hover:bg-accent/50 transition-colors shrink-0"
        onClick={toggleRightPanel}
        title="Open context panel"
      />
    )
  }

  return (
    <aside className="w-[360px] border-l border-border bg-background flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <span className="text-sm font-medium">Context</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleRightPanel}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={toggleRightPanel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activePanelTab} onValueChange={(v) => setActivePanelTab(v as 'artifacts' | 'progress' | 'activity')} className="flex-1 flex flex-col">
        <div className="px-4 pt-3">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="artifacts" className="text-xs">Artifacts</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 px-4 py-3">
          <TabsContent value="artifacts" className="mt-0">
            <ArtifactsTab artifacts={artifacts} />
          </TabsContent>

          <TabsContent value="progress" className="mt-0">
            <ProgressTab steps={progressSteps} />
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <ActivityTab items={activityItems} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  )
}

function ArtifactsTab({ artifacts }: { artifacts: Artifact[] }) {
  if (artifacts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No artifacts yet"
        description="Generated files will appear here"
      />
    )
  }

  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <div
          key={artifact.id}
          className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted transition-colors group"
        >
          {artifact.type === 'code' && <Code className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
          {artifact.type === 'document' && <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
          {artifact.type === 'image' && <Image className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
          {artifact.type === 'file' && <File className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{artifact.name}</span>
              {artifact.language && (
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground shrink-0">
                  {artifact.language}
                </span>
              )}
            </div>
            {artifact.preview && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{artifact.preview}</p>
            )}
            {artifact.size && (
              <span className="text-xs text-muted-foreground">{artifact.size}</span>
            )}
          </div>

          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button variant="outline" className="w-full mt-3 text-sm" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Download All
      </Button>
    </div>
  )
}

function ProgressTab({ steps }: { steps: ProgressStep[] }) {
  if (steps.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No active tasks"
        description="Task progress will appear here"
      />
    )
  }

  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.id} className="flex gap-3 relative">
          {/* Timeline line */}
          {index < steps.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
          )}

          {/* Status icon */}
          <div className="shrink-0 mt-0.5">
            {step.status === 'queued' && <Clock className="h-5 w-5 text-muted-foreground" />}
            {step.status === 'running' && <Loader2 className="h-5 w-5 text-ring animate-spin" />}
            {step.status === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
            {step.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-sm',
                step.status === 'running' && 'font-medium'
              )}>
                {step.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(step.timestamp)}
              </span>
            </div>

            {step.logs && step.logs.length > 0 && (
              <div className="mt-2 p-2 bg-muted rounded-md font-mono text-xs text-muted-foreground leading-relaxed">
                {step.logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivityTab({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No recent activity"
        description="Your activity will appear here"
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{item.description}</p>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(item.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Code; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
