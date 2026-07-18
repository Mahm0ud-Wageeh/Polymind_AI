import { api } from '@/lib/api'

export interface TroubleshootRequest {
  input: string
  type: 'config' | 'log' | 'show_command' | 'packet_tracer' | 'other'
  context?: string
}

export interface TroubleshootResponse {
  rootCause: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  explanation: string
  fixCommands: string
  bestPractices: string[]
}

export interface TroubleshootService {
  analyze(request: TroubleshootRequest): Promise<TroubleshootResponse>
}

class HttpTroubleshootService implements TroubleshootService {
  async analyze(request: TroubleshootRequest): Promise<TroubleshootResponse> {
    const workspaceId = localStorage.getItem('polymind.workspace')
    if (!workspaceId) throw new Error('Select a workspace before troubleshooting.')

    const res = await api.post<{ data: TroubleshootResponse }>('/tools/troubleshoot/analyze', {
      workspace_id: workspaceId,
      input: request.input,
      type: request.type,
      context: request.context,
    })

    return res.data
  }
}

export const troubleshootService: TroubleshootService = new HttpTroubleshootService()
