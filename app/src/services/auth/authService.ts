import { api, setToken } from '@/lib/api'
import type { User } from '@/types'

interface AuthResponse {
  user: User & { current_workspace_id?: string }
  token: string
}

function persist(res: AuthResponse): User {
  setToken(res.token)
  if (res.user.current_workspace_id) {
    localStorage.setItem('polymind.workspace', res.user.current_workspace_id)
  }
  return res.user
}

/**
 * Authentication service backed by the Polymind API (Sanctum token auth).
 */
export const authService = {
  async register(input: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }): Promise<User> {
    return persist(await api.post<AuthResponse>('/auth/register', input))
  },

  async login(input: { email: string; password: string }): Promise<User> {
    return persist(await api.post<AuthResponse>('/auth/login', input))
  },

  async me(): Promise<User> {
    const { user } = await api.get<{ user: User }>('/auth/me')
    return user
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      setToken(null)
      localStorage.removeItem('polymind.workspace')
      localStorage.removeItem('polymind.conversation')
    }
  },
}
