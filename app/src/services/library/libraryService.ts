import { api } from '@/lib/api'

export interface MarketAgent {
  id: string
  name: string
  icon?: string | null
  description?: string | null
  model?: string | null
  provider?: string | null
  is_public: boolean
}

export interface MarketTemplate {
  id: string
  name: string
  icon?: string | null
  description?: string | null
  prompt?: string
  category?: string | null
}

export interface BuiltinTool {
  id: string
  name: string
  description: string
  icon: string
  category: string
}

export interface McpServer {
  id: string
  name: string
  description: string
  url: string
  icon: string
}

export interface ToolsResponse {
  builtin: BuiltinTool[]
  mcp_servers: McpServer[]
}

/**
 * Library service: public agents, prompt templates, and available tools/MCP
 * servers surfaced in the Library (marketplace) page.
 */
export const libraryService = {
  agents: () => api.get<MarketAgent[]>('/agents'),
  templates: () => api.get<MarketTemplate[]>('/templates'),
  tools: () => api.get<ToolsResponse>('/tools'),
  createAgent: (body: Partial<MarketAgent> & { name: string }) =>
    api.post<MarketAgent>('/agents', body),
}
