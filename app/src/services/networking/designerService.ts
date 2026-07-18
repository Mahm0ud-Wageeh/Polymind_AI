import { api } from '@/lib/api'

export interface NetworkDesignRequest {
  prompt: string
  buildings?: number
  employees?: number
  dualIsp?: boolean
  activeDirectory?: boolean
  voip?: boolean
  cctv?: boolean
  guestWifi?: boolean
  multipleVlans?: boolean
  interVlanRouting?: boolean
  ospf?: boolean
  coreSwitches?: boolean
  distributionSwitches?: boolean
  accessSwitches?: boolean
  dmz?: boolean
  firewall?: boolean
}

export interface NetworkDesignResponse {
  id: string
  name: string
  prompt: string
  status: 'draft' | 'generating' | 'ready' | 'failed'
  summary?: string
  designData?: NetworkDesignData
  createdAt: string
  updatedAt: string
}

export interface NetworkDesignData {
  summary: string
  topology: { layers: Array<{ name: string; description: string }>; connections: Array<{ from: string; to: string; medium: string }> }
  devices: Array<{ name: string; role: string; type: string; modelSuggestion: string; count: number; layer: string }>
  ipAddressing: { strategy: string; subnets: Array<{ name: string; network: string; mask: string; vlanId: number; purpose: string }> }
  vlanPlan: Array<{ id: number; name: string; subnet: string; purpose: string }>
  routingPlan: { protocol: string; areas: string[]; details: string }
  security: { firewall: string; dmz: string; acls: string[] }
  deploymentPlan: Array<{ phase: string; tasks: string[] }>
  rackRecommendations: Array<{ unit: string; device: string }>
}

export interface DesignerService {
  generate(request: NetworkDesignRequest): Promise<NetworkDesignResponse>
  list(): Promise<NetworkDesignResponse[]>
  get(id: string): Promise<NetworkDesignResponse>
  delete(id: string): Promise<void>
}

interface ApiNetworkDesign {
  id: string
  name: string
  prompt: string
  status: NetworkDesignResponse['status']
  summary: string | null
  design_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

class HttpDesignerService implements DesignerService {
  async generate(request: NetworkDesignRequest): Promise<NetworkDesignResponse> {
    const workspaceId = localStorage.getItem('polymind.workspace')
    if (!workspaceId) throw new Error('Select a workspace before generating a network design.')
    return fromApi(await api.post<ApiNetworkDesign>('/network-designs/generate', { ...request, workspace_id: workspaceId }))
  }

  async list(): Promise<NetworkDesignResponse[]> {
    const workspaceId = localStorage.getItem('polymind.workspace')
    const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
    return (await api.get<ApiNetworkDesign[]>(`/network-designs${query}`)).map(fromApi)
  }

  async get(id: string): Promise<NetworkDesignResponse> {
    return fromApi(await api.get<ApiNetworkDesign>(`/network-designs/${id}`))
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/network-designs/${id}`)
  }
}

function fromApi(design: ApiNetworkDesign): NetworkDesignResponse {
  return {
    id: design.id,
    name: design.name,
    prompt: design.prompt,
    status: design.status,
    summary: design.summary ?? undefined,
    designData: design.design_data ? snakeToCamel(design.design_data) as NetworkDesignData : undefined,
    createdAt: design.created_at,
    updatedAt: design.updated_at,
  }
}

function snakeToCamel(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snakeToCamel)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), snakeToCamel(nested)]))
}

export const designerService: DesignerService = new HttpDesignerService()
