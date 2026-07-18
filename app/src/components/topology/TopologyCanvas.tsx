/**
 * Interactive network topology canvas built on React Flow.
 * Supports custom device nodes, auto-layout, zoom, pan, minimap, and export.
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type ReactFlowInstance,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Download,
  LayoutGrid,
  Image as ImageIcon,
  FileCode2,
  FileJson,
  Maximize2,
  ChevronDown,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import NetworkDeviceNode from './TopologyNode'
import {
  applyDagreLayout,
  downloadDrawioXml,
  downloadJson,
  type TopologyGraph,
} from './topologyUtils'
import type { NetworkDesignData } from '@/services/networking/designerService'

/* ------------------------------------------------------------------ */
/* Node types                                                          */
/* ------------------------------------------------------------------ */

const nodeTypes = { networkDevice: NetworkDeviceNode }

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

interface TopologyCanvasProps {
  initialGraph: TopologyGraph
  designData?: NetworkDesignData
  className?: string
  onNodeSelect?: (node: Node | null) => void
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function TopologyCanvas({ initialGraph, designData, className, onNodeSelect }: TopologyCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges)
  const [showMinimap] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const rfInstance = useRef<ReactFlowInstance | null>(null)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', animated: false, style: { stroke: '#64748b', strokeWidth: 2 } }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => onNodeSelect?.(node),
    [onNodeSelect]
  )

  const onPaneClick = useCallback(() => onNodeSelect?.(null), [onNodeSelect])

  // Auto-layout
  const handleAutoLayout = useCallback(
    (direction: 'TB' | 'LR' = 'TB') => {
      const layouted = applyDagreLayout({ nodes, edges }, direction)
      setNodes(layouted.nodes)
      setEdges(layouted.edges)
      setTimeout(() => rfInstance.current?.fitView({ padding: 0.2 }), 50)
    },
    [nodes, edges, setNodes, setEdges]
  )

  // Fit view
  const handleFitView = useCallback(() => {
    rfInstance.current?.fitView({ padding: 0.2 })
  }, [])

  // Export handlers
  const handleExportDrawio = useCallback(() => {
    downloadDrawioXml({ nodes, edges })
    setShowExportMenu(false)
  }, [nodes, edges])

  const handleExportJson = useCallback(() => {
    downloadJson(designData ?? { nodes, edges })
    setShowExportMenu(false)
  }, [nodes, edges, designData])

  const handleExportPng = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!viewport) return
    // Use canvas screenshot approach
    import('html-to-image' as string).then((mod: { toPng: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<string> }) => {
      mod.toPng(viewport, { backgroundColor: '#0a0a0a' }).then((dataUrl: string) => {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'polymind-topology.png'
        a.click()
      })
    }).catch(() => {
      // Fallback: alert user
      alert('PNG export requires html-to-image. Install with: npm install html-to-image')
    })
    setShowExportMenu(false)
  }, [])

  // Stats
  const stats = useMemo(() => ({
    devices: nodes.length,
    connections: edges.length,
  }), [nodes.length, edges.length])

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        onInit={(instance) => { rfInstance.current = instance }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
        {showMinimap && (
          <MiniMap
            nodeColor={(n) => (n.data as Record<string, unknown>)?.color as string ?? '#64748b'}
            maskColor="hsl(var(--background) / 0.8)"
            className="!bg-card !border !border-border !rounded-lg !shadow-lg"
          />
        )}
        <Controls
          showInteractive={false}
          className="!bg-card !border !border-border !rounded-lg !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent"
        />

        {/* Top-left panel: Stats */}
        <Panel position="top-left" className="!m-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card/90 backdrop-blur border border-border text-xs text-muted-foreground shadow-sm">
            <Info className="h-3.5 w-3.5" />
            <span>{stats.devices} devices</span>
            <span className="text-border">•</span>
            <span>{stats.connections} links</span>
          </div>
        </Panel>

        {/* Top-right panel: Actions */}
        <Panel position="top-right" className="!m-3">
          <div className="flex items-center gap-1.5">
            {/* Layout */}
            <Button variant="outline" size="sm" onClick={() => handleAutoLayout('TB')} className="gap-1.5 h-8 text-xs bg-card/90 backdrop-blur">
              <LayoutGrid className="h-3.5 w-3.5" />
              Auto Layout
            </Button>

            <Button variant="outline" size="icon" onClick={handleFitView} className="h-8 w-8 bg-card/90 backdrop-blur" title="Fit View">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>

            {/* Export Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="gap-1.5 h-8 text-xs bg-card/90 backdrop-blur"
              >
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                  <button onClick={handleExportDrawio} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors">
                    <FileCode2 className="h-3.5 w-3.5" /> Draw.io XML
                  </button>
                  <button onClick={handleExportJson} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors">
                    <FileJson className="h-3.5 w-3.5" /> JSON
                  </button>
                  <button onClick={handleExportPng} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors">
                    <ImageIcon className="h-3.5 w-3.5" /> PNG Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
