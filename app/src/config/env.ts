/** Typed access to the Laravel API base URL. */
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')

export const env = {
  apiUrl: apiUrl ?? 'http://localhost:8000/api/v1',
} as const
