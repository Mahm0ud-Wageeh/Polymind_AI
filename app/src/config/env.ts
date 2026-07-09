/**
 * Centralised, typed access to Vite environment variables.
 *
 * `VITE_API_URL`  — base URL of the Polymind backend API (e.g. http://localhost:8000/api/v1).
 * `VITE_USE_MOCK` — when "true" (or when no API URL is set) the app runs fully
 *                   on the in-memory mock services, so the UI works with zero backend.
 */
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')

export const env = {
  apiUrl: apiUrl ?? '',
  useMock: (import.meta.env.VITE_USE_MOCK as string | undefined) === 'true' || !apiUrl,
} as const
