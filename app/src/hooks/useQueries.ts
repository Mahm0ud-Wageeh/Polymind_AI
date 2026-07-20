import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardService, type DashboardOverview } from '@/services/dashboard/dashboardService'
import { projectService, type ApiProject } from '@/services/projects/projectService'
import { designerService, type NetworkDesignResponse } from '@/services/networking/designerService'
import { libraryService, type MarketAgent, type MarketTemplate, type ToolsResponse } from '@/services/library/libraryService'
import { agentsService, type Agent } from '@/services/agents/agentsService'

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: dashboardService.overview,
  })
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */
export function useProjects(workspaceId: string | undefined) {
  return useQuery<ApiProject[]>({
    queryKey: ['projects', workspaceId],
    queryFn: () => projectService.list(workspaceId!),
    enabled: !!workspaceId,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectService.create,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['projects', variables.workspaceId] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

/* ------------------------------------------------------------------ */
/* Network Designs                                                     */
/* ------------------------------------------------------------------ */
export function useNetworkDesigns() {
  return useQuery<NetworkDesignResponse[]>({
    queryKey: ['network-designs'],
    queryFn: designerService.list,
  })
}

export function useNetworkDesign(id: string | undefined) {
  return useQuery<NetworkDesignResponse>({
    queryKey: ['network-designs', id],
    queryFn: () => designerService.get(id!),
    enabled: !!id,
  })
}

export function useGenerateDesign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: designerService.generate,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['network-designs'] })
    },
  })
}

export function useDeleteDesign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => designerService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['network-designs'] })
    },
  })
}

/* ------------------------------------------------------------------ */
/* Agents                                                              */
/* ------------------------------------------------------------------ */
export function useAgents(workspaceId?: string) {
  return useQuery<Agent[]>({
    queryKey: ['agents', workspaceId],
    queryFn: () => agentsService.list(workspaceId),
  })
}

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */
export function useLibraryAgents() {
  return useQuery<MarketAgent[]>({
    queryKey: ['library', 'agents'],
    queryFn: libraryService.agents,
  })
}

export function useLibraryTemplates() {
  return useQuery<MarketTemplate[]>({
    queryKey: ['library', 'templates'],
    queryFn: libraryService.templates,
  })
}

export function useLibraryTools() {
  return useQuery<ToolsResponse>({
    queryKey: ['library', 'tools'],
    queryFn: libraryService.tools,
  })
}
