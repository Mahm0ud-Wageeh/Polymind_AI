import { api } from '@/lib/api'

export interface LabDevice {
  name: string
  slug?: string
  kind?: string
  image?: string
  port_count?: number
}

export interface NodeStatusEntry {
  name: string
  status: string
  uptime: number | string | null
  stats: { cpu: number; memory: number; disk?: number }
}

export interface Lab {
  id: string
  user_id: string
  workspace_id: string | null
  name: string
  description: string | null
  status: 'stopped' | 'running' | 'error'
  clab_definition: string | null
  devices: LabDevice[] | null
  node_status: NodeStatusEntry[] | null
  lab_directory: string | null
  started_at: string | null
  stopped_at: string | null
  created_at: string
  updated_at: string
}

export interface LabCreateRequest {
  workspace_id?: string
  name: string
  description?: string
  clab_definition?: string
  devices?: { name: string; kind?: string; image?: string; port_count?: number }[]
}

export interface LabUpdateRequest {
  name?: string
  description?: string
  clab_definition?: string
}

export interface LabService {
  list(workspaceId?: string): Promise<Lab[]>
  get(id: string): Promise<Lab>
  create(req: LabCreateRequest): Promise<Lab>
  update(id: string, req: LabUpdateRequest): Promise<Lab>
  delete(id: string): Promise<void>
  start(id: string): Promise<Lab>
  stop(id: string): Promise<Lab>
  refresh(id: string): Promise<Lab>
}

class HttpLabService implements LabService {
  private base = '/labs'

  async list(workspaceId?: string): Promise<Lab[]> {
    const params = workspaceId ? `?workspace_id=${workspaceId}` : ''
    const res = await api.get<Lab[]>(this.base + params)
    return res
  }

  async get(id: string): Promise<Lab> {
    return api.get<Lab>(`${this.base}/${id}`)
  }

  async create(req: LabCreateRequest): Promise<Lab> {
    return api.post<Lab>(this.base, req)
  }

  async update(id: string, req: LabUpdateRequest): Promise<Lab> {
    return api.patch<Lab>(`${this.base}/${id}`, req)
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.base}/${id}`)
  }

  async start(id: string): Promise<Lab> {
    return api.post<Lab>(`${this.base}/${id}/start`)
  }

  async stop(id: string): Promise<Lab> {
    return api.post<Lab>(`${this.base}/${id}/stop`)
  }

  async refresh(id: string): Promise<Lab> {
    return api.post<Lab>(`${this.base}/${id}/refresh`)
  }
}

export const labService: LabService = new HttpLabService()
