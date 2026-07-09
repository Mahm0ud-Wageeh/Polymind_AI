import { lazy, Suspense, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { PageLoader } from '@/shared/components/PageLoader'
import { Toaster } from '@/components/ui/sonner'

// Code splitting: each top-level page is loaded on demand so the initial
// bundle stays small. Named exports are adapted to the default export shape
// that React.lazy expects.
const AppShell = lazy(() =>
  import('@/components/shell/AppShell').then((m) => ({ default: m.AppShell }))
)
const Auth = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.Auth })))
const Onboarding = lazy(() =>
  import('@/pages/Onboarding').then((m) => ({ default: m.Onboarding }))
)
const Settings = lazy(() =>
  import('@/pages/Settings').then((m) => ({ default: m.Settings }))
)
const Library = lazy(() =>
  import('@/pages/Library').then((m) => ({ default: m.Library }))
)

function CurrentPage() {
  // Subscribe to just the slice we need to avoid re-rendering on every store
  // change.
  const currentPage = useStore((state) => state.currentPage)

  switch (currentPage) {
    case 'auth':
      return <Auth />
    case 'onboarding':
      return <Onboarding />
    case 'settings':
      return <Settings />
    case 'library':
      return <Library />
    case 'workspace':
    default:
      return <AppShell />
  }
}

export default function App() {
  const setTheme = useStore((state) => state.setTheme)
  const theme = useStore((state) => state.theme)
  const reducedMotion = useStore((state) => state.preferences.reducedMotion)

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

  // Reflect the reduced-motion preference on the root element so global CSS
  // can damp animations and transitions.
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <CurrentPage />
      </Suspense>
      <Toaster position="top-center" richColors closeButton />
    </ErrorBoundary>
  )
}
