/**
 * Custom React Flow node for network devices.
 * Renders device icon, name, role, and connection handles.
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Router,
  Layers,
  Shield,
  Server,
  Monitor,
  Cloud,
  Wifi,
  HelpCircle,
} from 'lucide-react'
import type { DeviceCategory } from './topologyUtils'

interface DeviceNodeData {
  label: string
  deviceType: DeviceCategory
  role: string
  model?: string
  count?: number
  layer?: string
  color: string
  [key: string]: unknown
}

const DEVICE_ICONS: Record<DeviceCategory, typeof Router> = {
  router: Router,
  switch: Layers,
  firewall: Shield,
  server: Server,
  pc: Monitor,
  cloud: Cloud,
  wireless: Wifi,
  unknown: HelpCircle,
}

function NetworkDeviceNode({ data, selected }: NodeProps) {
  const d = data as unknown as DeviceNodeData
  const Icon = DEVICE_ICONS[d.deviceType] ?? HelpCircle

  return (
    <div
      className={`
        group relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-card
        transition-all duration-200 min-w-[180px] max-w-[260px]
        ${selected
          ? 'border-ring shadow-lg shadow-ring/20 scale-[1.02]'
          : 'border-border hover:border-ring/50 hover:shadow-md'
        }
      `}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" id="left" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" id="right" />

      {/* Icon */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
        style={{ backgroundColor: d.color + '20', color: d.color }}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate leading-tight">{d.label}</p>
        <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{d.role}</p>
        {d.model && (
          <p className="text-[10px] text-muted-foreground/70 truncate leading-tight">{d.model}</p>
        )}
      </div>

      {/* Count badge */}
      {(d.count ?? 0) > 1 && (
        <span
          className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
          style={{ backgroundColor: d.color }}
        >
          ×{d.count}
        </span>
      )}

      {/* Layer badge */}
      {d.layer && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border whitespace-nowrap">
          {d.layer}
        </span>
      )}
    </div>
  )
}

export default memo(NetworkDeviceNode)
