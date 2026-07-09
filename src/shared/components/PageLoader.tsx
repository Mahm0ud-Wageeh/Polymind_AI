/**
 * Lightweight full-screen loader used as the Suspense fallback while a lazily
 * loaded route/page chunk is being fetched.
 */
export function PageLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  )
}
