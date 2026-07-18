import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { getToken } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { PageLoader } from '@/shared/components/PageLoader'
import { Toaster } from '@/components/ui/sonner'
import { modules, type ModuleManifest } from '@/modules/registry'

/* ------------------------------------------------------------------ */
/* Lazy-loaded standalone pages (no AppShell chrome)
/* ------------------------------------------------------------------ */
const AppShell = lazy(() =>
  import('@/components/shell/AppShell').then((m) => ({ default: m.AppShell }))
)
const Auth = lazy(() =>
  import('@/pages/Auth').then((m) => ({ default: m.Auth }))
)
const Onboarding = lazy(() =>
  import('@/pages/Onboarding').then((m) => ({ default: m.Onboarding }))
)
const Settings = lazy(() =>
  import('@/pages/Settings').then((m) => ({ default: m.Settings }))
)

/* ------------------------------------------------------------------ */
/* Pre-lazy-load all module pages once at module scope so React.lazy
/* is not called during render (which would remount on every render).
/* ------------------------------------------------------------------ */
const modulePages: Record<string, React.LazyExoticComponent<React.ComponentType<unknown>>> = {}
for (const mod of modules) {
  modulePages[mod.id] = lazy(mod.load)
}

function ModulePage({ mod }: { mod: ModuleManifest }) {
  const Page = modulePages[mod.id]
  if (!Page) return <Navigate to="/workspace" replace />
  return <Page />
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/auth" replace />
}

/* ------------------------------------------------------------------ */
/* App root
/* ------------------------------------------------------------------ */

export default function App() {
  const setTheme = useStore((state) => state.setTheme)
  const theme = useStore((state) => state.theme)
  const reducedMotion = useStore((state) => state.preferences.reducedMotion)
  const hydrate = useStore((state) => state.hydrate)

  // Apply the persisted/system theme once on mount, and keep it in sync with
  // the OS preference while the user stays on "system".
  useEffect(() => {
    setTheme(theme)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (useStore.getState().theme === 'system') setTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void hydrate().catch(() => undefined)
  }, [hydrate])

  // Reflect the reduced-motion preference on the root element so global CSS
  // can damp animations and transitions.
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Standalone pages — no AppShell chrome */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* AppShell layout — sidebar + topbar + context panel.
              Module routes are mapped to <Route> elements directly (React
              Router requires Route/Fragment children only, no wrapper comps). */}
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            {modules.map((mod) => (
              <Route
                key={mod.id}
                path={mod.path}
                element={<Suspense fallback={<PageLoader />}><ModulePage mod={mod} /></Suspense>}
              />
            ))}
            <Route index element={<Navigate to="/workspace" replace />} />
          </Route>

          {/* Settings is full-screen with its own nav — no AppShell */}
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/workspace" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-center" richColors closeButton />
    </ErrorBoundary>
  )
}
