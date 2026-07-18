import { api } from '@/lib/api'

export interface CiscoCliRequest {
  deviceType: string
  platform: string
  features: string[]
  parameters?: Record<string, unknown>
}

export interface CiscoCliResponse {
  configuration: string
  explanation: string
}

export interface CiscoCliService {
  generate(request: CiscoCliRequest): Promise<CiscoCliResponse>
}

class HttpCiscoCliService implements CiscoCliService {
  async generate(request: CiscoCliRequest): Promise<CiscoCliResponse> {
    const workspaceId = localStorage.getItem('polymind.workspace')
    if (!workspaceId) throw new Error('Select a workspace before generating configuration.')

    const res = await api.post<{ data: CiscoCliResponse }>('/tools/cisco-cli/generate', {
      workspace_id: workspaceId,
      device_type: request.deviceType,
      platform: request.platform,
      features: request.features,
      parameters: request.parameters,
    })

    return res.data
  }
}

export const ciscoCliService: CiscoCliService = new HttpCiscoCliService()
