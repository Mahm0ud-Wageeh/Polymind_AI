/**
 * Topology utilities — convert NetworkDesignData into React Flow nodes/edges,
 * auto-layout with dagre, Draw.io XML export.
 */

import dagre from 'dagre'
import type { Node, Edge, MarkerType } from '@xyflow/react'
import type { NetworkDesignData } from '@/services/networking/designerService'

/* ------------------------------------------------------------------ */
/* Device Icon Mapping                                                 */
/* ------------------------------------------------------------------ */

export type DeviceCategory = 'router' | 'switch' | 'firewall' | 'server' | 'pc' | 'cloud' | 'wireless' | 'unknown'

export function deviceCategory(type: string, role?: string): DeviceCategory {
  const t = (type + ' ' + (role ?? '')).toLowerCase()
  if (t.includes('router') || t.includes('gateway')) return 'router'
  if (t.includes('firewall') || t.includes('asa') || t.includes('utm')) return 'firewall'
  if (t.includes('server') || t.includes('dc') || t.includes('dns') || t.includes('dhcp')) return 'server'
  if (t.includes('switch') || t.includes('layer 2') || t.includes('l2') || t.includes('layer 3') || t.includes('l3') || t.includes('core') || t.includes('distribution') || t.includes('access')) return 'switch'
  if (t.includes('wireless') || t.includes('wifi') || t.includes('ap') || t.includes('wap') || t.includes('wlc')) return 'wireless'
  if (t.includes('cloud') || t.includes('internet') || t.includes('wan') || t.includes('isp')) return 'cloud'
  if (t.includes('pc') || t.includes('host') || t.includes('workstation') || t.includes('client') || t.includes('user') || t.includes('endpoint')) return 'pc'
  return 'unknown'
}

export function deviceColor(cat: DeviceCategory): string {
  switch (cat) {
    case 'router': return '#3b82f6'     // blue
    case 'switch': return '#8b5cf6'     // purple
    case 'firewall': return '#ef4444'   // red
    case 'server': return '#10b981'     // green
    case 'pc': return '#6b7280'         // gray
    case 'cloud': return '#06b6d4'      // cyan
    case 'wireless': return '#f59e0b'   // amber
    case 'unknown': return '#6b7280'    // gray
  }
}

/* ------------------------------------------------------------------ */
/* Convert Design Data → React Flow Graph                              */
/* ------------------------------------------------------------------ */

export interface TopologyGraph {
  nodes: Node[]
  edges: Edge[]
}

export function designToGraph(data: NetworkDesignData): TopologyGraph {
  if (!data.devices || data.devices.length === 0) {
    return { nodes: [], edges: [] }
  }

  // Create nodes from devices
  const nodes: Node[] = data.devices.map((device) => {
    const cat = deviceCategory(device.type, device.role)
    return {
      id: device.name.replace(/\s+/g, '_'),
      type: 'networkDevice',
      data: {
        label: device.name,
        deviceType: cat,
        role: device.role,
        model: device.modelSuggestion,
        count: device.count,
        layer: device.layer,
        color: deviceColor(cat),
      },
      position: { x: 0, y: 0 }, // Will be set by layout
    }
  })

  // Create edges from connections
  const edges: Edge[] = (data.topology?.connections ?? []).map((conn, i) => ({
    id: `e-${i}`,
    source: conn.from.replace(/\s+/g, '_'),
    target: conn.to.replace(/\s+/g, '_'),
    type: 'smoothstep',
    animated: conn.medium?.toLowerCase().includes('fiber'),
    label: conn.medium || '',
    style: { stroke: '#64748b', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed' as MarkerType, color: '#64748b' },
    data: { medium: conn.medium },
  }))

  return applyDagreLayout({ nodes, edges })
}

/* ------------------------------------------------------------------ */
/* Dagre Auto-Layout                                                   */
/* ------------------------------------------------------------------ */

const NODE_WIDTH = 200
const NODE_HEIGHT = 80

export function applyDagreLayout(
  graph: TopologyGraph,
  direction: 'TB' | 'LR' = 'TB'
): TopologyGraph {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120, marginx: 50, marginy: 50 })

  for (const node of graph.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const edge of graph.edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  const layoutedNodes = graph.nodes.map((node) => {
    const dagreNode = g.node(node.id)
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges: graph.edges }
}

/* ------------------------------------------------------------------ */
/* Draw.io XML Export                                                   */
/* ------------------------------------------------------------------ */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function exportToDrawioXml(graph: TopologyGraph): string {
  let cellId = 2

  const deviceShapes: Record<DeviceCategory, string> = {
    router: 'shape=mxgraph.cisco19.rect;prIcon=router',
    switch: 'shape=mxgraph.cisco19.rect;prIcon=l2_switch',
    firewall: 'shape=mxgraph.cisco19.rect;prIcon=firewall',
    server: 'shape=mxgraph.cisco19.rect;prIcon=file_server',
    pc: 'shape=mxgraph.cisco19.rect;prIcon=pc',
    cloud: 'shape=mxgraph.cisco19.rect;prIcon=cloud',
    wireless: 'shape=mxgraph.cisco19.rect;prIcon=wireless_router',
    unknown: 'shape=mxgraph.cisco19.rect;prIcon=router',
  }

  const nodeCells: string[] = []
  const nodeIdMap = new Map<string, number>()

  for (const node of graph.nodes) {
    const id = cellId++
    nodeIdMap.set(node.id, id)
    const cat = (node.data as Record<string, unknown>).deviceType as DeviceCategory
    const label = escapeXml((node.data as Record<string, unknown>).label as string)
    const style = deviceShapes[cat] ?? deviceShapes.unknown
    const x = Math.round(node.position.x)
    const y = Math.round(node.position.y)
    nodeCells.push(
      `      <mxCell id="${id}" value="${label}" style="${style};fillColor=${escapeXml(deviceColor(cat))};fontColor=#ffffff;fontSize=12;" vertex="1" parent="1">` +
      `\n        <mxGeometry x="${x}" y="${y}" width="120" height="60" as="geometry" />` +
      `\n      </mxCell>`
    )
  }

  const edgeCells: string[] = []
  for (const edge of graph.edges) {
    const id = cellId++
    const source = nodeIdMap.get(edge.source)
    const target = nodeIdMap.get(edge.target)
    if (source === undefined || target === undefined) continue
    const label = escapeXml(typeof edge.label === 'string' ? edge.label : '')
    edgeCells.push(
      `      <mxCell id="${id}" value="${label}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#64748b;strokeWidth=2;fontSize=10;" edge="1" source="${source}" target="${target}" parent="1">` +
      `\n        <mxGeometry relative="1" as="geometry" />` +
      `\n      </mxCell>`
    )
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="Polymind" modified="${new Date().toISOString()}" type="device">
  <diagram name="Network Topology" id="topology">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
${nodeCells.join('\n')}
${edgeCells.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
}

/* ------------------------------------------------------------------ */
/* PNG Export (via React Flow's toObject + html2canvas)                 */
/* ------------------------------------------------------------------ */

export function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadDrawioXml(graph: TopologyGraph, filename = 'polymind-topology.drawio') {
  downloadBlob(exportToDrawioXml(graph), filename, 'application/xml')
}

export function downloadJson(data: unknown, filename = 'polymind-topology.json') {
  downloadBlob(JSON.stringify(data, null, 2), filename, 'application/json')
}
