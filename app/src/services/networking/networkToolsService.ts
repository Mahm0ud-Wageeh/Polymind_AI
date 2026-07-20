import { api } from '@/lib/api'
import type { NetworkDesignData } from './designerService'

function workspaceId(): string {
  const id = localStorage.getItem('polymind.workspace')
  if (!id) throw new Error('Select a workspace before using this tool.')
  return id
}

export interface IpPlanResponse {
  summary: { network: string; broadcast: string; prefix: number; mask: string; total_hosts: number; usable_hosts: number; first_usable: string; last_usable: string }
  allocations: Array<{ name: string; required_hosts: number; usable_hosts: number; network: string; cidr: string; mask: string; gateway: string; host_min: string; host_max: string; broadcast: string; waste: number }>
  total_waste: number
}

export interface ValidationResponse {
  issues: Array<{ severity: 'critical' | 'warning' | 'info'; category: string; title: string; description: string; suggestion: string }>
  score: number
  summary: { critical: number; warning: number; info: number; total: number }
}

export interface ConfigDiffResponse {
  chunks: Array<{ type: 'added' | 'removed' | 'unchanged'; line: string }>
  summary: { added: number; removed: number; unchanged: number }
}

export const networkToolsService = {
  planIp: (cidr: string, requirements: Array<{ name: string; hosts: number }> = []) =>
    api.post<IpPlanResponse>('/tools/ip-plan', { workspace_id: workspaceId(), cidr, requirements }),
  validate: (design: NetworkDesignData) =>
    api.post<ValidationResponse>('/tools/validate', { workspace_id: workspaceId(), design }),
  diff: (original: string, updated: string) =>
    api.post<ConfigDiffResponse>('/tools/config-diff', { workspace_id: workspaceId(), original, updated }),
  documentation: (networkDesignId: string) =>
    api.post<{ filename: string; markdown: string }>('/tools/documentation/generate', { workspace_id: workspaceId(), network_design_id: networkDesignId }),
}
