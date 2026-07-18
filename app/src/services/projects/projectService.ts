import { api } from '@/lib/api'

export interface ApiProject {
  id: string
  workspace_id: string
  name: string
  description: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export const projectService = {
  list(workspaceId: string) {
    return api.get<ApiProject[]>(`/projects?workspace_id=${encodeURIComponent(workspaceId)}`)
  },
  create(input: { workspaceId: string; name: string; description?: string; color?: string }) {
    return api.post<ApiProject>('/projects', {
      workspace_id: input.workspaceId,
      name: input.name,
      description: input.description || null,
      color: input.color || null,
    })
  },
  update(id: string, input: Partial<Pick<ApiProject, 'name' | 'description' | 'color'>>) {
    return api.patch<ApiProject>(`/projects/${id}`, input)
  },
  remove(id: string) {
    return api.delete<void>(`/projects/${id}`)
  },
}
