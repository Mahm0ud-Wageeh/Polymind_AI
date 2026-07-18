import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Sparkles,
  Search,
  Code2,
  Target,
  PenLine,
  FileText,
  Lightbulb,
  Languages,
  Globe,
  Terminal,
  Image as ImageIcon,
  Github,
  MessageSquare,
  Plug,
  Bot,
  LayoutTemplate,
  Wrench,
  Loader2,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  libraryService,
  type MarketAgent,
  type MarketTemplate,
  type BuiltinTool,
  type McpServer,
} from '@/services/library/libraryService'

const iconMap: Record<string, typeof Sparkles> = {
  Search,
  Code2,
  Target,
  PenLine,
  FileText,
  Lightbulb,
  Languages,
  Globe,
  Terminal,
  Image: ImageIcon,
  Github,
  MessageSquare,
  Bot,
  Sparkles,
}

function Icon({ name, className }: { name?: string | null; className?: string }) {
  const Cmp = (name && iconMap[name]) || Sparkles
  return <Cmp className={className} />
}

type LibraryTab = 'agents' | 'templates' | 'tools'

export function Library() {
  const navigate = useNavigate()
  const createConversation = useStore((s) => s.createConversation)
  const [tab, setTab] = useState<LibraryTab>('agents')
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<MarketAgent[]>([])
  const [templates, setTemplates] = useState<MarketTemplate[]>([])
  const [builtin, setBuiltin] = useState<BuiltinTool[]>([])
  const [mcp, setMcp] = useState<McpServer[]>([])

  useEffect(() => {
    let active = true
    Promise.all([
      libraryService.agents().catch(() => [] as MarketAgent[]),
      libraryService.templates().catch(() => [] as MarketTemplate[]),
      libraryService.tools().catch(() => ({ builtin: [], mcp_servers: [] })),
    ])
      .then(([a, t, tools]) => {
        if (!active) return
        setAgents(a)
        setTemplates(t)
        setBuiltin(tools.builtin)
        setMcp(tools.mcp_servers)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function handleUseAgent(agent: MarketAgent) {
    createConversation()
    navigate('/workspace')
    toast.success(`Started a chat with ${agent.name}`)
  }

  async function handleUseTemplate(t: MarketTemplate) {
    if (t.prompt) {
      try {
        await navigator.clipboard.writeText(t.prompt)
        toast.success('Prompt copied \u2014 paste it into the composer')
      } catch {
        toast.message(t.prompt)
      }
    }
    navigate('/workspace')
  }

  const tabs: { id: LibraryTab; label: string; icon: typeof Bot }[] = [
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'tools', label: 'Tools & MCP', icon: Wrench },
  ]

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 h-16 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/workspace')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold leading-tight">Library</h1>
          <p className="text-xs text-muted-foreground">Discover agents, templates, and tools</p>
        </div>
      </header>

      <div className="px-6 pt-4 shrink-0">
        <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors',
                tab === item.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {tab === 'agents' && (
              <Grid empty={agents.length === 0} emptyLabel="No public agents yet">
                {agents.map((a) => (
                  <Card key={a.id}>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                        <Icon name={a.icon} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      {a.model ? (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{a.model}</span>
                      ) : (
                        <span />
                      )}
                      <Button size="sm" onClick={() => handleUseAgent(a)}>
                        Chat
                      </Button>
                    </div>
                  </Card>
                ))}
              </Grid>
            )}

            {tab === 'templates' && (
              <Grid empty={templates.length === 0} emptyLabel="No templates yet">
                {templates.map((t) => (
                  <Card key={t.id}>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                        <Icon name={t.icon} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      {t.category ? (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">{t.category}</span>
                      ) : (
                        <span />
                      )}
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleUseTemplate(t)}>
                        <Copy className="h-3.5 w-3.5" />
                        Use
                      </Button>
                    </div>
                  </Card>
                ))}
              </Grid>
            )}

            {tab === 'tools' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-sm font-semibold mb-3">Built-in tools</h2>
                  <Grid empty={builtin.length === 0} emptyLabel="No tools available">
                    {builtin.map((tool) => (
                      <Card key={tool.id}>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                            <Icon name={tool.icon} className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{tool.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Grid>
                </section>

                <section>
                  <h2 className="text-sm font-semibold mb-3">MCP servers</h2>
                  {mcp.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                      <Plug className="h-4 w-4 shrink-0" />
                      No MCP servers configured. Add MCP_* URLs to the backend .env to enable them.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {mcp.map((s) => (
                        <Card key={s.id}>
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                              <Icon name={s.icon} className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{s.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Grid({ children, empty, emptyLabel }: { children: ReactNode; empty: boolean; emptyLabel: string }) {
  if (empty) {
    return <div className="text-center py-16 text-sm text-muted-foreground">{emptyLabel}</div>
  }
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col p-4 border border-border rounded-xl bg-card hover:border-ring/30 transition-colors">
      {children}
    </div>
  )
}
