import { Link, useNavigate } from 'react-router'
import { FolderKanban, Network, TrendingUp, MessageSquare, Coins, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardOverview } from '@/hooks/useQueries'

const quickLinks = [
  { icon: Network, label: 'Network Designer', to: '/designer' },
  { icon: FolderKanban, label: 'Projects', to: '/projects' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useDashboardOverview()

  const stats = data
    ? [
        { label: 'Conversations', value: data.stats.conversations.toLocaleString(), icon: MessageSquare },
        { label: 'Tokens used (30 days)', value: (data.stats.tokens_input + data.stats.tokens_output).toLocaleString(), icon: Coins },
        { label: 'AI cost (30 days)', value: `$${data.stats.cost.toFixed(4)}`, icon: TrendingUp },
      ]
    : []

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your network engineering workspace at a glance.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 animate-slide-in-bottom sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:border-ring/40 hover:bg-accent hover:shadow-md active:translate-y-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground"><link.icon className="h-5 w-5" /></span>
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium"><AlertCircle className="h-4 w-4" /> Dashboard data could not be loaded.</div>
            <p className="mt-1 text-muted-foreground">{error.message}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your workspace data…</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 gap-3 animate-slide-in-bottom sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"><stat.icon className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-semibold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div></div>
              ))}
            </div>
            <section className="mt-8 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Recent conversations</h2>
              {data.recent_conversations.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No conversations yet. Start one from AI Chat.</p> : (
                <div className="mt-3 divide-y divide-border">
                  {data.recent_conversations.map((conversation) => (
                    <Button key={conversation.id} variant="ghost" className="h-auto w-full justify-start px-2 py-3 text-left" onClick={() => { localStorage.setItem('polymind.conversation', conversation.id); navigate('/workspace') }}><span className="truncate">{conversation.title}</span></Button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
