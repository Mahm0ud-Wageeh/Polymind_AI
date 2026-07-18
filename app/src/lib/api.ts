import { env } from '@/config/env'

const TOKEN_KEY = 'polymind.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function headers(extra?: HeadersInit): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function parse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : await res.text()
  if (!res.ok) {
    const message =
      (isJson && (body as { message?: string })?.message) || `Request failed (${res.status})`
    throw new ApiError(message, res.status, body)
  }
  return body as T
}

/**
 * Thin typed wrapper around fetch that injects the auth token and base URL.
 */
export const api = {
  get: <T>(path: string): Promise<T> =>
    fetch(`${env.apiUrl}${path}`, { headers: headers() }).then((r) => parse<T>(r)),

  post: <T>(path: string, body?: unknown): Promise<T> =>
    fetch(`${env.apiUrl}${path}`, {
      method: 'POST',
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => parse<T>(r)),

  postForm: <T>(path: string, body: FormData): Promise<T> =>
    fetch(`${env.apiUrl}${path}`, {
      method: 'POST',
      headers: (() => {
        const token = getToken()
        return { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })(),
      body,
    }).then((r) => parse<T>(r)),

  patch: <T>(path: string, body?: unknown): Promise<T> =>
    fetch(`${env.apiUrl}${path}`, {
      method: 'PATCH',
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => parse<T>(r)),

  delete: <T>(path: string): Promise<T> =>
    fetch(`${env.apiUrl}${path}`, { method: 'DELETE', headers: headers() }).then((r) => parse<T>(r)),

  /**
   * POST that consumes a Server-Sent Events stream. `onEvent` is called for
   * each parsed `event:`/`data:` pair until the stream closes.
   */
  async stream(
    path: string,
    body: unknown,
    onEvent: (event: string, data: Record<string, unknown>) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const res = await fetch(`${env.apiUrl}${path}`, {
      method: 'POST',
      headers: headers({ Accept: 'text/event-stream' }),
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok || !res.body) {
      throw new ApiError(`Stream failed (${res.status})`, res.status)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''

      for (const chunk of chunks) {
        let event = 'message'
        let data = ''
        for (const line of chunk.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim()
          else if (line.startsWith('data:')) data += line.slice(5).trim()
        }
        if (!data) continue
        try {
          onEvent(event, JSON.parse(data))
        } catch {
          onEvent(event, { raw: data })
        }
      }
    }
  },
}
