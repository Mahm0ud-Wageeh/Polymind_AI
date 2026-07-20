import { api } from '@/lib/api'

export interface Agent {
    id: string
    name: string
    icon?: string | null
    description?: string | null
    system_prompt?: string | null
    provider?: string | null
    model?: string | null
    temperature?: number | null
    domain: string
    is_public: boolean
}

export const agentsService = {
    list: (workspaceId?: string): Promise<Agent[]> =>
        api.get<Agent[]>(`/agents${workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''}`),
    get: (id: string): Promise<Agent> => api.get<Agent>(`/agents/${id}`),
}