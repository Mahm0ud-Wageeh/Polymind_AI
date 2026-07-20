/**
 * The single source of truth for the currently delivered application modules.
 * Each entry has a real page and a corresponding backend capability.
 */
import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import { FolderKanban, LayoutDashboard, Library, MessageSquare, Network, Terminal, Calculator, ShieldAlert, GitCompare, Wrench, Bot, Waypoints, FileText, FlaskConical } from 'lucide-react'

export type NavGroup = 'create' | 'manage' | 'system'
export type DomainId = 'networking'

export interface ModuleManifest {
  id: string
  name: string
  description: string
  icon: LucideIcon
  domain: DomainId
  path: string
  navGroup: NavGroup
  order: number
  inNav: boolean
  load: () => Promise<{ default: ComponentType<unknown> }>
}

export const modules: ModuleManifest[] = [
  {
    id: 'dashboard', name: 'Dashboard', description: 'Networking overview, usage, and activity',
    icon: LayoutDashboard, domain: 'networking', path: '/dashboard', navGroup: 'manage', order: 1, inNav: true,
    load: () => import('@/modules/networking/pages/Dashboard'),
  },
  {
    id: 'projects', name: 'Projects', description: 'Organize network engineering work by project',
    icon: FolderKanban, domain: 'networking', path: '/projects', navGroup: 'manage', order: 2, inNav: true,
    load: () => import('@/modules/networking/pages/Projects'),
  },
  {
    id: 'designer', name: 'Network Designer', description: 'Create and save an AI-generated network design',
    icon: Network, domain: 'networking', path: '/designer', navGroup: 'create', order: 1, inNav: true,
    load: () => import('@/modules/networking/pages/Designer'),
  },
  {
    id: 'topology-designer', name: 'Topology Designer', description: 'Drag-and-drop interactive network diagram editor',
    icon: Waypoints, domain: 'networking', path: '/tools/topology-designer', navGroup: 'create', order: 1.5, inNav: true,
    load: () => import('@/modules/networking/pages/TopologyDesigner'),
  },
  {
    id: 'workspace', name: 'AI Chat', description: 'Chat with the network engineering assistant',
    icon: MessageSquare, domain: 'networking', path: '/workspace', navGroup: 'create', order: 0, inNav: false,
    load: () => import('@/modules/networking/pages/Workspace'),
  },
  {
    id: 'cisco-cli', name: 'Cisco CLI Generator', description: 'Generate production-ready Cisco configurations',
    icon: Terminal, domain: 'networking', path: '/tools/cisco-cli', navGroup: 'create', order: 2, inNav: true,
    load: () => import('@/modules/networking/pages/CiscoCliGenerator'),
  },
  {
    id: 'ip-planner', name: 'IP Address Planner', description: 'Subnet Calculator and VLSM Planner',
    icon: Calculator, domain: 'networking', path: '/tools/ip-planner', navGroup: 'create', order: 3, inNav: true,
    load: () => import('@/modules/networking/pages/IpPlanner'),
  },
  {
    id: 'validator', name: 'Network Validator', description: 'Analyze designs for conflicts and issues',
    icon: ShieldAlert, domain: 'networking', path: '/tools/validator', navGroup: 'create', order: 4, inNav: true,
    load: () => import('@/modules/networking/pages/NetworkValidator'),
  },
  {
    id: 'config-diff', name: 'Config Diff Engine', description: 'Compare Cisco configurations',
    icon: GitCompare, domain: 'networking', path: '/tools/config-diff', navGroup: 'create', order: 5, inNav: true,
    load: () => import('@/modules/networking/pages/ConfigDiff'),
  },
  {
    id: 'troubleshooter', name: 'AI Troubleshooter', description: 'Analyze logs and configurations for issues',
    icon: Wrench, domain: 'networking', path: '/tools/troubleshooter', navGroup: 'create', order: 6, inNav: true,
    load: () => import('@/modules/networking/pages/Troubleshooter'),
  },
  {
    id: 'library', name: 'Library', description: 'Browse agents, templates, and tools',
    icon: Library, domain: 'networking', path: '/library', navGroup: 'system', order: 1, inNav: true,
    load: () => import('@/modules/networking/pages/Library'),
  },
  {
    id: 'agents', name: 'AI Agents', description: '16 specialized network engineering AI agents',
    icon: Bot, domain: 'networking', path: '/agents', navGroup: 'create', order: 7, inNav: true,
    load: () => import('@/modules/networking/pages/Agents'),
  },
  {
    id: 'lab-emulator', name: 'Lab Emulator', description: 'Virtual labs with Containerlab network emulation',
    icon: FlaskConical, domain: 'networking', path: '/tools/lab-emulator', navGroup: 'create', order: 7.5, inNav: true,
    load: () => import('@/modules/networking/pages/LabEmulator'),
  },
  {
    id: 'documentation', name: 'Documentation', description: 'AI network documentation, BOM & PDF export',
    icon: FileText, domain: 'networking', path: '/tools/documentation', navGroup: 'create', order: 3.5, inNav: true,
    load: () => import('@/modules/networking/pages/NetworkDocumentation'),
  },
]

export interface DomainDefinition { id: DomainId; name: string; tagline: string }

export const domains: DomainDefinition[] = [
  { id: 'networking', name: 'Networking', tagline: 'Network Engineering Workspace' },
]

const GROUP_RANK: Record<NavGroup, number> = { manage: 0, create: 1, system: 2 }
export const NAV_GROUP_LABELS: Record<NavGroup, string> = { manage: 'Manage', create: 'Create', system: 'System' }

export function navModules(): ModuleManifest[] {
  return modules.filter((module) => module.inNav).sort((a, b) => GROUP_RANK[a.navGroup] - GROUP_RANK[b.navGroup] || a.order - b.order)
}

export function getModule(id: string): ModuleManifest | undefined {
  return modules.find((module) => module.id === id)
}
