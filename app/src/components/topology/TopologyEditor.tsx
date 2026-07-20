import { useCallback, useEffect, useState, type DragEvent } from 'react'
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    Panel,
    addEdge,
    useNodesState,
    useEdgesState,
    useReactFlow,
    type Connection,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
    LayoutGrid, Maximize2, Undo2, Redo2, Trash2, Save, Download,
    FileCode2, FileJson, Image as ImageIcon, ChevronDown, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateId } from '@/lib/utils'
import NetworkDeviceNode from './TopologyNode'
import { DEVICE_CATALOG, paletteColor } from './deviceCatalog'
import { applyDagreLayout, downloadDrawioXml, downloadJson, deviceColor } from './topologyUtils'
import { useUndoRedo } from './useUndoRedo'

const nodeTypes = { networkDevice: NetworkDeviceNode }
const STORAGE_KEY = 'polymind.topology.draft'
const DND_TYPE = 'application/polymind-device'

function loadDraft(): { nodes: Node[]; edges: Edge[] } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return { nodes: [], edges: [] }
}

function EditorInner() {
    const [draft] = useState(loadDraft)
    const [nodes, setNodes, onNodesChange] = useNodesState(draft.nodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(draft.edges)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [showExport, setShowExport] = useState(false)
    const { screenToFlowPosition, fitView } = useReactFlow()
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo()

    const selected = nodes.find((n) => n.id === selectedId) ?? null

    // خُد snapshot قبل عمليات الحذف عشان الـ undo يشتغل
    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        if (changes.some((c) => c.type === 'remove')) takeSnapshot({ nodes, edges })
        onNodesChange(changes)
    }, [nodes, edges, onNodesChange, takeSnapshot])

    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
        if (changes.some((c) => c.type === 'remove')) takeSnapshot({ nodes, edges })
        onEdgesChange(changes)
    }, [nodes, edges, onEdgesChange, takeSnapshot])

    // توصيل جهازين بخط
    const onConnect = useCallback((c: Connection) => {
        takeSnapshot({ nodes, edges })
        setEdges((eds) => addEdge({ ...c, type: 'smoothstep', style: { stroke: '#64748b', strokeWidth: 2 } }, eds))
    }, [nodes, edges, setEdges, takeSnapshot])

    // السحب والإفلات من المكتبة
    const onDragOver = useCallback((e: DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }, [])

    const onDrop = useCallback((e: DragEvent) => {
        e.preventDefault()
        const key = e.dataTransfer.getData(DND_TYPE)
        const item = DEVICE_CATALOG.find((d) => d.key === key)
        if (!item) return
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
        takeSnapshot({ nodes, edges })
        const id = `${item.key}-${generateId()}`
        const newNode: Node = {
            id,
            type: 'networkDevice',
            position,
            data: {
                label: item.label,
                deviceType: item.category,
                role: item.role,
                color: deviceColor(item.category),
            },
        }
        setNodes((nds) => nds.concat(newNode))
        setSelectedId(id)
    }, [screenToFlowPosition, nodes, edges, setNodes, takeSnapshot])

    // تعديل الجهاز المحدّد
    const patchSelected = useCallback((patch: Record<string, unknown>) => {
        setNodes((nds) => nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n)))
    }, [selectedId, setNodes])

    const deleteSelected = useCallback(() => {
        if (!selectedId) return
        takeSnapshot({ nodes, edges })
        setNodes((nds) => nds.filter((n) => n.id !== selectedId))
        setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId))
        setSelectedId(null)
    }, [selectedId, nodes, edges, setNodes, setEdges, takeSnapshot])

    // أزرار الشريط
    const autoLayout = useCallback(() => {
        takeSnapshot({ nodes, edges })
        const l = applyDagreLayout({ nodes, edges }, 'TB')
        setNodes(l.nodes)
        setEdges(l.edges)
        setTimeout(() => fitView({ padding: 0.2 }), 50)
    }, [nodes, edges, setNodes, setEdges, fitView, takeSnapshot])

    const clearAll = useCallback(() => {
        if (nodes.length === 0 && edges.length === 0) return
        takeSnapshot({ nodes, edges })
        setNodes([])
        setEdges([])
        setSelectedId(null)
    }, [nodes, edges, setNodes, setEdges, takeSnapshot])

    const save = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
    }, [nodes, edges])

    const doUndo = useCallback(() => {
        const s = undo({ nodes, edges })
        if (s) { setNodes(s.nodes); setEdges(s.edges); setSelectedId(null) }
    }, [nodes, edges, undo, setNodes, setEdges])

    const doRedo = useCallback(() => {
        const s = redo({ nodes, edges })
        if (s) { setNodes(s.nodes); setEdges(s.edges); setSelectedId(null) }
    }, [nodes, edges, redo, setNodes, setEdges])

    // اختصارات Ctrl+Z / Ctrl+Y (بتتجاهل الكتابة في الحقول)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
            const k = e.key.toLowerCase()
            if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo() }
            else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); doRedo() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [doUndo, doRedo])

    // تصدير
    const exportDrawio = useCallback(() => { downloadDrawioXml({ nodes, edges }); setShowExport(false) }, [nodes, edges])
    const exportJson = useCallback(() => { downloadJson({ nodes, edges }); setShowExport(false) }, [nodes, edges])
    const exportPng = useCallback(() => {
        setShowExport(false)
        const vp = document.querySelector('.react-flow__viewport') as HTMLElement | null
        if (!vp) return
        import('html-to-image' as string)
            .then((m: { toPng: (el: HTMLElement, o?: Record<string, unknown>) => Promise<string> }) =>
                m.toPng(vp, { backgroundColor: '#0a0a0a' }).then((url) => {
                    const a = document.createElement('a')
                    a.href = url; a.download = 'polymind-topology.png'; a.click()
                }))
            .catch(() => alert('PNG export يحتاج html-to-image. شغّل: docker compose exec frontend npm install html-to-image'))
    }, [])

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* المكتبة */}
            <div className="w-52 shrink-0 border-r border-border bg-background overflow-y-auto p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Devices</p>
                <p className="text-[11px] text-muted-foreground mb-3">اسحب أي جهاز وأفلته على اللوحة</p>
                <div className="space-y-2">
                    {DEVICE_CATALOG.map((item) => (
                        <div
                            key={item.key}
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData(DND_TYPE, item.key); e.dataTransfer.effectAllowed = 'move' }}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing hover:border-ring/50 transition-colors"
                        >
                            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: paletteColor(item.category) }} />
                            <span className="text-sm truncate">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* اللوحة */}
            <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, n) => setSelectedId(n.id)}
                    onPaneClick={() => setSelectedId(null)}
                    nodeTypes={nodeTypes}
                    deleteKeyCode={['Delete']}
                    fitView
                    minZoom={0.1}
                    maxZoom={4}
                    proOptions={{ hideAttribution: true }}
                    className="bg-background"
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
                    <MiniMap
                        nodeColor={(n) => ((n.data as Record<string, unknown>)?.color as string) ?? '#64748b'}
                        maskColor="hsl(var(--background) / 0.8)"
                        className="!bg-card !border !border-border !rounded-lg"
                    />
                    <Controls showInteractive={false} className="!bg-card !border !border-border !rounded-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent" />

                    {/* شريط الأدوات */}
                    <Panel position="top-right" className="!m-3">
                        <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="icon" onClick={doUndo} disabled={!canUndo} className="h-8 w-8 bg-card/90 backdrop-blur" title="Undo (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="icon" onClick={doRedo} disabled={!canRedo} className="h-8 w-8 bg-card/90 backdrop-blur" title="Redo (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="sm" onClick={autoLayout} className="gap-1.5 h-8 text-xs bg-card/90 backdrop-blur"><LayoutGrid className="h-3.5 w-3.5" />Auto Layout</Button>
                            <Button variant="outline" size="icon" onClick={() => fitView({ padding: 0.2 })} className="h-8 w-8 bg-card/90 backdrop-blur" title="Fit View"><Maximize2 className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="icon" onClick={save} className="h-8 w-8 bg-card/90 backdrop-blur" title="Save"><Save className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="icon" onClick={clearAll} className="h-8 w-8 bg-card/90 backdrop-blur" title="Clear"><Trash2 className="h-3.5 w-3.5" /></Button>
                            <div className="relative">
                                <Button variant="outline" size="sm" onClick={() => setShowExport((v) => !v)} className="gap-1.5 h-8 text-xs bg-card/90 backdrop-blur"><Download className="h-3.5 w-3.5" />Export<ChevronDown className="h-3 w-3" /></Button>
                                {showExport && (
                                    <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                                        <button onClick={exportDrawio} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent"><FileCode2 className="h-3.5 w-3.5" /> Draw.io XML</button>
                                        <button onClick={exportJson} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent"><FileJson className="h-3.5 w-3.5" /> JSON</button>
                                        <button onClick={exportPng} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent"><ImageIcon className="h-3.5 w-3.5" /> PNG</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Panel>

                    {/* إحصائيات */}
                    <Panel position="top-left" className="!m-3">
                        <div className="px-3 py-2 rounded-lg bg-card/90 backdrop-blur border border-border text-xs text-muted-foreground">
                            {nodes.length} devices • {edges.length} links
                        </div>
                    </Panel>

                    {/* لوحة تعديل الجهاز المحدّد */}
                    {selected && (
                        <Panel position="bottom-right" className="!m-3">
                            <div className="w-64 bg-card border border-border rounded-lg shadow-xl p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold">Edit device</span>
                                    <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                                </div>
                                <div>
                                    <label className="text-[11px] text-muted-foreground">Name</label>
                                    <input
                                        value={((selected.data as Record<string, unknown>).label as string) ?? ''}
                                        onFocus={() => takeSnapshot({ nodes, edges })}
                                        onChange={(e) => patchSelected({ label: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-border rounded-md bg-background outline-none focus:border-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-muted-foreground">Role</label>
                                    <input
                                        value={((selected.data as Record<string, unknown>).role as string) ?? ''}
                                        onFocus={() => takeSnapshot({ nodes, edges })}
                                        onChange={(e) => patchSelected({ role: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-border rounded-md bg-background outline-none focus:border-ring"
                                    />
                                </div>
                                <Button variant="destructive" size="sm" onClick={deleteSelected} className="w-full gap-1.5 h-8 text-xs"><Trash2 className="h-3.5 w-3.5" /> Delete device</Button>
                            </div>
                        </Panel>
                    )}
                </ReactFlow>
            </div>
        </div>
    )
}

export default function TopologyEditor() {
    return (
        <ReactFlowProvider>
            <EditorInner />
        </ReactFlowProvider>
    )
}
