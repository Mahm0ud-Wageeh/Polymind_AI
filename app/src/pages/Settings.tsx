import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  User,
  Building2,
  Palette,
  Brain,
  Plug,
  CreditCard,
  Bell,
  Shield,
  Keyboard,
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  billingService,
  type BillingOverview,
  type Plan,
} from '@/services/billing/billingService'
import type { SettingsTab } from '@/types'

const settingsTabs: { id: SettingsTab; icon: typeof User; label: string }[] = [
  { id: 'account', icon: User, label: 'Account' },
  { id: 'workspace', icon: Building2, label: 'Workspace' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'models', icon: Brain, label: 'Models' },
  { id: 'integrations', icon: Plug, label: 'Integrations' },
  { id: 'billing', icon: CreditCard, label: 'Billing' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'shortcuts', icon: Keyboard, label: 'Keyboard Shortcuts' },
]

const shortcuts = [
  { action: 'New Chat', keys: ['⌘', 'N'] },
  { action: 'Search', keys: ['⌘', 'K'] },
  { action: 'Send Message', keys: ['Enter'] },
  { action: 'New Line', keys: ['Shift', 'Enter'] },
  { action: 'Toggle Sidebar', keys: ['⌘', 'B'] },
  { action: 'Toggle Panel', keys: ['⌘', 'J'] },
  { action: 'Command Palette', keys: ['⌘', 'Shift', 'P'] },
  { action: 'Close/Cancel', keys: ['ESC'] },
]

export function Settings() {
  const { settingsTab, setSettingsTab, theme, setTheme, preferences, updatePreferences } = useStore()
  const navigate = useNavigate()

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-4 gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation */}
        <div className="w-[240px] border-r border-border bg-background hidden md:block">
          <ScrollArea className="h-full py-2">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left',
                  settingsTab === tab.id
                    ? 'bg-accent text-accent-foreground border-l-2 border-ring'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => setSettingsTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Mobile tab selector */}
        <div className="md:hidden w-full border-b border-border p-2 overflow-x-auto">
          <div className="flex gap-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors',
                  settingsTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
                onClick={() => setSettingsTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto p-6 md:p-8">
            {settingsTab === 'account' && <AccountTab />}
            {settingsTab === 'workspace' && <WorkspaceTab />}
            {settingsTab === 'appearance' && (
              <AppearanceTab
                theme={theme}
                setTheme={setTheme}
                reducedMotion={preferences.reducedMotion}
                setReducedMotion={(v) => updatePreferences({ reducedMotion: v })}
              />
            )}
            {settingsTab === 'models' && <ModelsTab />}
            {settingsTab === 'shortcuts' && <ShortcutsTab />}
            {settingsTab === 'notifications' && <NotificationsTab />}
            {settingsTab === 'security' && <SecurityTab />}
            {settingsTab === 'billing' && <BillingTab />}
            {settingsTab === 'integrations' && <IntegrationsTab />}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function AccountTab() {
  const { user, updateUserProfile } = useStore()
  const [name, setName] = useState(user?.name ?? '')
  const dirty = name.trim() !== (user?.name ?? '') && name.trim().length > 0

  const handleSave = () => {
    updateUserProfile({ name: name.trim() })
    toast.success('Profile updated')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Account</h2>
        <p className="text-sm text-muted-foreground">Manage your profile information</p>
      </div>

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-xl font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
              <User className="h-3 w-3" />
            </button>
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.role}</p>
          </div>
        </div>

        <Separator />

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email} disabled className="h-10 bg-muted" />
          </div>

          <Button onClick={handleSave} disabled={!dirty}>
            Save changes
          </Button>
        </div>

        <Separator />

        {/* Danger Zone */}
        <div>
          <h3 className="text-sm font-medium text-destructive mb-3">Danger Zone</h3>
          <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  )
}

function WorkspaceTab() {
  const { currentWorkspace, updateWorkspace } = useStore()
  const [wsName, setWsName] = useState(currentWorkspace.name)
  const wsDirty = wsName.trim() !== currentWorkspace.name && wsName.trim().length > 0

  const handleSaveWorkspace = () => {
    updateWorkspace({ name: wsName.trim() })
    toast.success('Workspace updated')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Workspace</h2>
        <p className="text-sm text-muted-foreground">Manage your workspace settings</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ws-name">Workspace Name</Label>
          <Input
            id="ws-name"
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            className="h-10"
          />
          <Button onClick={handleSaveWorkspace} disabled={!wsDirty} size="sm" className="mt-2">
            Save
          </Button>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-3">Members</h3>
          <div className="space-y-2">
            {['Alex Chen', 'Sarah Miller', 'James Wilson'].map((name, i) => (
              <div key={name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i === 0 ? 'Admin' : 'Member'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-3" size="sm">
            Invite Member
          </Button>
        </div>
      </div>
    </div>
  )
}

function AppearanceTab({
  theme,
  setTheme,
  reducedMotion,
  setReducedMotion,
}: {
  theme: string
  setTheme: (t: 'light' | 'dark' | 'system') => void
  reducedMotion: boolean
  setReducedMotion: (v: boolean) => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Appearance</h2>
        <p className="text-sm text-muted-foreground">Customize how Polymind looks</p>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Sun, label: 'Light', value: 'light' },
              { icon: Moon, label: 'Dark', value: 'dark' },
              { icon: Monitor, label: 'System', value: 'system' },
            ].map((t) => (
              <button
                key={t.value}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 border rounded-xl transition-all',
                  theme === t.value
                    ? 'border-ring bg-accent text-accent-foreground'
                    : 'border-border hover:bg-muted'
                )}
                onClick={() => setTheme(t.value as 'light' | 'dark' | 'system')}
              >
                <t.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Reduced Motion</Label>
            <p className="text-sm text-muted-foreground">Minimize animations throughout the interface</p>
          </div>
          <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
        </div>
      </div>
    </div>
  )
}

function ModelsTab() {
  const { preferences, updatePreferences } = useStore()
  const [temperature, setTemperature] = useState([preferences.temperature])
  const [maxTokens, setMaxTokens] = useState(String(preferences.maxTokens))
  const [systemPrompt, setSystemPrompt] = useState(preferences.systemPrompt)
  const [defaultModel, setDefaultModel] = useState(preferences.defaultModel)

  const models = [
    { name: 'GPT-4o', desc: 'Best for general tasks' },
    { name: 'Claude 3.5', desc: 'Best for analysis' },
    { name: 'Gemini Pro', desc: 'Best for research' },
  ]

  const handleSave = () => {
    const tokens = Number.parseInt(maxTokens, 10)
    updatePreferences({
      defaultModel,
      temperature: temperature[0],
      maxTokens: Number.isFinite(tokens) && tokens > 0 ? tokens : 4096,
      systemPrompt,
    })
    toast.success('Model preferences saved')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">AI Models</h2>
        <p className="text-sm text-muted-foreground">Configure your AI model preferences</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Default Model</Label>
          <div className="grid gap-2">
            {models.map((model) => (
              <button
                key={model.name}
                onClick={() => setDefaultModel(model.name)}
                className={cn(
                  'flex items-center justify-between p-4 border rounded-xl transition-colors text-left',
                  defaultModel === model.name
                    ? 'border-ring bg-accent text-accent-foreground'
                    : 'border-border hover:bg-muted'
                )}
              >
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-muted-foreground">{model.desc}</div>
                </div>
                {defaultModel === model.name && <Check className="h-5 w-5 text-ring" />}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label>Temperature: {temperature[0]}</Label>
            <p className="text-sm text-muted-foreground mb-3">Higher values make output more creative</p>
            <Slider value={temperature} onValueChange={setTemperature} max={1} step={0.1} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-24 p-3 text-sm border border-border rounded-lg bg-background resize-none outline-none focus:border-ring transition-colors"
              placeholder="Enter a custom system prompt..."
            />
          </div>

          <Button onClick={handleSave}>Save preferences</Button>
        </div>
      </div>
    </div>
  )
}

function ShortcutsTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Keyboard Shortcuts</h2>
        <p className="text-sm text-muted-foreground">Speed up your workflow with these shortcuts</p>
      </div>

      <div className="space-y-1">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.action}
            className="flex items-center justify-between py-3 border-b border-border last:border-0"
          >
            <span className="text-sm">{shortcut.action}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, i) => (
                <span key={i} className="flex items-center gap-1">
                  <kbd className="bg-muted border border-border rounded px-2 py-1 text-xs font-mono">
                    {key}
                  </kbd>
                  {i < shortcut.keys.length - 1 && <span className="text-muted-foreground">+</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationsTab() {
  const { preferences, updatePreferences } = useStore()
  const items: { key: keyof typeof preferences.notifications; label: string; desc: string }[] = [
    { key: 'newMessages', label: 'New messages', desc: 'Get notified when you receive new messages' },
    { key: 'mentions', label: 'Mentions', desc: 'Get notified when someone mentions you' },
    { key: 'taskCompletions', label: 'Task completions', desc: 'Get notified when tasks are completed' },
    { key: 'systemUpdates', label: 'System updates', desc: 'Get notified about system updates' },
    { key: 'marketingEmails', label: 'Marketing emails', desc: 'Receive marketing and promotional emails' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Notifications</h2>
        <p className="text-sm text-muted-foreground">Choose what you want to be notified about</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={preferences.notifications[item.key]}
              onCheckedChange={(v) =>
                updatePreferences({ notifications: { ...preferences.notifications, [item.key]: v } })
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Security</h2>
        <p className="text-sm text-muted-foreground">Manage your security settings</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
          </div>
          <Button variant="outline" size="sm">Enable</Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input id="current-password" type="password" className="h-10" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input id="new-password" type="password" className="h-10" />
        </div>

        <Button>Update Password</Button>
      </div>
    </div>
  )
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

function UsageBar({
  label,
  used,
  limit,
  ratio,
}: {
  label: string
  used: number
  limit?: number
  ratio: number | null
}) {
  const pct = ratio != null ? Math.round(ratio * 100) : 0
  const barStyle = { width: `${Math.min(pct, 100)}%` }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {formatNumber(used)}
          {limit && limit > 0 ? ` / ${formatNumber(limit)}` : ''}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={barStyle}
        />
      </div>
    </div>
  )
}

function BillingTab() {
  const [overview, setOverview] = useState<BillingOverview | null>(null)
  const [plans, setPlans] = useState<Record<string, Plan>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([billingService.overview(), billingService.plans()])
      .then(([ov, pl]) => {
        if (!active) return
        setOverview(ov)
        setPlans(pl.plans)
      })
      .catch((err) => toast.error((err as Error)?.message ?? 'Failed to load billing'))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function upgrade(planKey: string) {
    setBusy(planKey)
    try {
      const { url } = await billingService.checkout(planKey)
      window.location.assign(url)
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Could not start checkout')
    } finally {
      setBusy(null)
    }
  }

  async function manage() {
    setBusy('portal')
    try {
      const { url } = await billingService.portal()
      window.location.href = url
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Could not open billing portal')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  const currentPlan = overview?.plan ?? 'free'
  const usage = overview?.usage
  const details = overview?.plan_details

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage your subscription and usage</p>
      </div>

      <div className="p-4 border border-border rounded-xl bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Current Plan</span>
          <span className="text-xs px-2 py-1 bg-accent rounded-full font-medium capitalize">
            {details?.name ?? currentPlan}
          </span>
        </div>
        <p className="text-2xl font-semibold">
          ${details?.price ?? 0}
          <span className="text-sm text-muted-foreground font-normal">/{details?.interval ?? 'month'}</span>
        </p>
      </div>

      {usage && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Usage this month</h3>
          <UsageBar
            label="Messages"
            used={usage.messages}
            limit={usage.limits?.messages_per_month}
            ratio={usage.usage_ratio?.messages ?? null}
          />
          <UsageBar
            label="Tokens"
            used={usage.tokens}
            limit={usage.limits?.tokens_per_month}
            ratio={usage.usage_ratio?.tokens ?? null}
          />
          <p className="text-xs text-muted-foreground">
            Estimated cost this month: ${usage.cost.toFixed(2)}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Plans</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(plans).map(([key, plan]) => {
            const isCurrent = key === currentPlan
            return (
              <div
                key={key}
                className={cn(
                  'flex flex-col p-4 border rounded-xl',
                  isCurrent ? 'border-primary ring-1 ring-primary' : 'border-border',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{plan.name}</span>
                  {isCurrent && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xl font-semibold mt-1">
                  ${plan.price}
                  <span className="text-xs text-muted-foreground font-normal">/{plan.interval}</span>
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground flex-1">
                  {plan.features?.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4"
                  size="sm"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || plan.price === 0 || busy === key}
                  onClick={() => upgrade(key)}
                >
                  {busy === key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    'Current plan'
                  ) : plan.price === 0 ? (
                    'Free'
                  ) : (
                    'Upgrade'
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {overview?.billing_enabled && currentPlan !== 'free' && (
        <Button variant="outline" onClick={manage} disabled={busy === 'portal'}>
          {busy === 'portal' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Manage Subscription'}
        </Button>
      )}

      {!overview?.billing_enabled && (
        <p className="text-xs text-muted-foreground">
          Billing is running in preview mode. Add your Stripe keys to enable checkout.
        </p>
      )}
    </div>
  )
}

function IntegrationsTab() {
  const integrations = [
    { name: 'GitHub', desc: 'Connect your repositories', connected: true },
    { name: 'Slack', desc: 'Get notifications in Slack', connected: false },
    { name: 'Notion', desc: 'Sync with your Notion workspace', connected: false },
    { name: 'Google Drive', desc: 'Access your Google Drive files', connected: true },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Integrations</h2>
        <p className="text-sm text-muted-foreground">Connect Polymind with your favorite tools</p>
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between p-4 border border-border rounded-xl"
          >
            <div>
              <p className="text-sm font-medium">{integration.name}</p>
              <p className="text-xs text-muted-foreground">{integration.desc}</p>
            </div>
            <Button
              variant={integration.connected ? 'outline' : 'default'}
              size="sm"
            >
              {integration.connected ? 'Connected' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
