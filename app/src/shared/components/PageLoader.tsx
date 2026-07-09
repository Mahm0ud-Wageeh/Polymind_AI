/**
 * Lightweight full-screen loader used as the Suspense fallback while a lazily
 * loaded route/page chunk is being fetched.
 */
export function PageLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground animate-spin" />
        </div>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}
