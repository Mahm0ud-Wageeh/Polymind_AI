import { lazy, Suspense, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { PageLoader } from '@/shared/components/PageLoader'

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
    case 'workspace':
    default:
      return <AppShell />
  }
}

export default function App() {
  const setTheme = useStore((state) => state.setTheme)
  const theme = useStore((state) => state.theme)

  // Apply the persisted/system theme once on mount.
  useEffect(() => {
    setTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <CurrentPage />
      </Suspense>
    </ErrorBoundary>
  )
}
