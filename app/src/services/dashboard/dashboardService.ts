import { api } from '@/lib/api'

export interface DashboardOverview {
  stats: {
    conversations: number
    tokens_input: number
    tokens_output: number
    cost: number
  }
  usage_by_day: Array<{ day: string; tokens: number; cost: number }>
  recent_conversations: Array<{ id: string; title: string; last_message_at: string | null }>
}

export const dashboardService = {
  overview: () => api.get<DashboardOverview>('/dashboard'),
}
