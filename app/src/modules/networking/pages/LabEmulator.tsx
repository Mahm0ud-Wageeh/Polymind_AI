import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical,
  Play,
  Square,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  Network,
  Server,
  Monitor,
  Router,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { labService, type Lab, type LabCreateRequest } from '@/services/networking/labService'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const DEVICE_KINDS = [
  { id: 'vr-cisco', label: 'Cisco IOL', icon: Router },
  { id: 'vr-xe', label: 'Cisco IOS-XE', icon: Router },
  { id: 'catalyst', label: 'Catalyst Switch', icon: Monitor },
  { id: 'linux', label: 'Generic Linux', icon: Server },
]

export default function LabEmulator() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [selected, setSelected] = useState<Lab | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // New lab form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDevices, setNewDevices] = useState<{ name: string; kind: string; port_count: number }[]>([])
  const [newDeviceName, setNewDeviceName] = useState('')
  const [newDeviceKind, setNewDeviceKind] = useState('vr-cisco')

  const fetchLabs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await labService.list()
      setLabs(data)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLabs()
  }, [fetchLabs])

  const selectLab = async (lab: Lab) => {
    setSelected(lab)
  }

  const handleAction = async (action: 'start' | 'stop' | 'refresh', lab: Lab) => {
    if (!lab) return
    setActionLoading(action)
    try {
      const updated = await labService[action](lab.id)
      setLabs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setSelected(updated)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (lab: Lab) => {
    try {
      await labService.delete(lab.id)
      setLabs((prev) => prev.filter((l) => l.id !== lab.id))
      if (selected?.id === lab.id) setSelected(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const addDeviceField = () => {
    if (!newDeviceName.trim()) return
    setNewDevices([
      ...newDevices,
      { name: newDeviceName.trim(), kind: newDeviceKind, port_count: 4 },
    ])
    setNewDeviceName('')
  }

  const removeDeviceField = (index: number) => {
    setNewDevices(newDevices.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    const req: LabCreateRequest = {
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      devices: newDevices.length > 0 ? newDevices : undefined,
    }

    try {
      const created = await labService.create(req)
      setLabs((prev) => [created, ...prev])
      setSelected(created)
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
      setNewDevices([])
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const formatUptime = (status: string, uptime: number | string | null): string => {
    if (status !== 'running') return 'Stopped'
    if (typeof uptime === 'number') return `${uptime}m`
    return uptime?.toString() ?? 'N/A'
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel — Lab List + Create */}
      <div className="w-[420px] border-r border-border bg-muted/10 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Lab Emulator
          </h1>
          <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Lab
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {showCreate && (
            <div className="mb-4 p-4 rounded-lg border border-border bg-card space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Lab name"
                className="w-full p-2 text-sm border border-border rounded bg-muted/30 outline-none focus:border-ring"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full p-2 text-sm border border-border rounded bg-muted/30 outline-none focus:border-ring resize-none"
              />

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Devices</label>
                {newDevices.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Network className="h-3 w-3" />
                    <span className="flex-1">{d.name}</span>
                    <span className="text-muted-foreground/60">{d.kind}</span>
                    <button onClick={() => removeDeviceField(i)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="Device name"
                    className="flex-1 p-1.5 text-xs border border-border rounded bg-muted/30 outline-none focus:border-ring"
                  />
                  <select
                    value={newDeviceKind}
                    onChange={(e) => setNewDeviceKind(e.target.value)}
                    className="p-1.5 text-xs border border-border rounded bg-muted/30 outline-none focus:border-ring"
                  >
                    {DEVICE_KINDS.map((k) => (
                      <option key={k.id} value={k.id}>{k.label}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={addDeviceField} className="h-7 px-2 text-xs">
                    Add
                  </Button>
                </div>
              </div>

              <Button size="sm" onClick={handleCreate} className="w-full gap-1 text-xs">
                <FlaskConical className="h-3.5 w-3.5" />
                Create Lab
              </Button>
            </div>
          )}

          {loading && labs.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && labs.length === 0 && !showCreate && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
              <FlaskConical className="h-10 w-10 mb-3 opacity-20" />
              <p>No virtual labs yet.</p>
              <p className="text-xs mt-1">Click "New Lab" to create one.</p>
            </div>
          )}

          <div className="space-y-2">
            {labs.map((lab) => {
              const isActive = selected?.id === lab.id
              return (
                <button
                  key={lab.id}
                  onClick={() => selectLab(lab)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border text-sm transition-all',
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-accent'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{lab.name}</span>
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase',
                        lab.status === 'running' ? 'bg-green-500/10 text-green-600' :
                        lab.status === 'error'    ? 'bg-destructive/10 text-destructive' :
                                                    'bg-muted text-muted-foreground'
                      )}
                    >
                      {lab.status}
                    </span>
                  </div>
                  {lab.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lab.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {lab.devices?.length ?? 0} devices &middot; Updated {new Date(lab.updated_at).toLocaleDateString()}
                  </p>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel — Lab Detail */}
      <div className="flex-1 flex flex-col bg-card">
        {selected ? (
          <>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-semibold">{selected.name}</h2>
                {selected.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('start', selected)}
                  disabled={selected.status === 'running' || actionLoading === 'start'}
                  className="h-8 gap-1 text-xs"
                >
                  {actionLoading === 'start' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('stop', selected)}
                  disabled={selected.status === 'stopped' || actionLoading === 'stop'}
                  className="h-8 gap-1 text-xs"
                >
                  {actionLoading === 'stop' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('refresh', selected)}
                  disabled={actionLoading === 'refresh'}
                  className="h-8 gap-1 text-xs"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', actionLoading === 'refresh' && 'animate-spin')} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(selected)}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            <ScrollArea className="flex-1 p-6">
              {/* Node Status */}
              {selected.node_status && selected.node_status.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    Node Status
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selected.node_status.map((node) => (
                      <div
                        key={node.name}
                        className={cn(
                          'p-3 rounded-lg border text-sm',
                          node.status === 'running' ? 'border-green-500/20 bg-green-500/5' :
                          node.status === 'error'    ? 'border-destructive/20 bg-destructive/5' :
                                                       'border-border bg-muted/10'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs">{node.name}</span>
                          <span
                            className={cn(
                              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                              node.status === 'running' ? 'bg-green-500/10 text-green-600' :
                              node.status === 'error'    ? 'bg-destructive/10 text-destructive' :
                                                           'bg-muted text-muted-foreground'
                            )}
                          >
                            {node.status}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                          <span>Uptime: {formatUptime(node.status, node.uptime)}</span>
                          <span>CPU: {node.stats.cpu}%</span>
                          <span>Memory: {node.stats.memory}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Devices */}
              {selected.devices && selected.devices.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Devices</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-left pb-2 font-medium">Name</th>
                        <th className="text-left pb-2 font-medium">Kind</th>
                        <th className="text-left pb-2 font-medium">Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.devices.map((d, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1.5">{d.slug ?? d.name}</td>
                          <td className="py-1.5 text-muted-foreground">{d.kind ?? '-'}</td>
                          <td className="py-1.5 text-muted-foreground font-mono text-[10px]">{d.image ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Containerlab Definition */}
              {selected.clab_definition && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Network className="h-4 w-4 text-primary" />
                    Containerlab Topology
                  </h3>
                  <SyntaxHighlighter
                    language="yaml"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '13px' }}
                    showLineNumbers
                  >
                    {selected.clab_definition}
                  </SyntaxHighlighter>
                </div>
              )}

              {(!selected.node_status || selected.node_status.length === 0) && !selected.clab_definition && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
                  <FlaskConical className="h-12 w-12 mb-4 opacity-20" />
                  <p>No lab data yet.</p>
                  <p className="text-xs mt-1">Start the lab to populate node status.</p>
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <FlaskConical className="h-14 w-14 mb-4 opacity-15" />
            <p className="text-sm">Select a lab from the list or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
