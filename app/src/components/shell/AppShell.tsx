import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useStore } from '@/store/useStore'
import { useMediaQuery } from '@/hooks/use-mobile'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { RightPanel } from '@/components/panel/RightPanel'
import { CommandPalette } from '@/components/command/CommandPalette'
import { Sheet, SheetContent } from '@/components/ui/sheet'

/**
 * AppShell — the main authenticated layout route.
 *
 * Renders the sidebar, topbar, and context panel around a central
 * <Outlet /> where module pages render. Each module page decides its own
 * content (e.g. Workspace fills the outlet with ChatArea + Composer;
 * Dashboard fills it with stats; Designer fills it with the form, etc.).
 */
export function AppShell() {
  const {
    mobileSidebarOpen,
    setMobileSidebarOpen,
    rightPanelOpen,
    toggleRightPanel,
    setRightPanelOpen,
  } = useStore()

  // The context panel is inline on xl+ screens and a drawer below that.
  const isXl = useMediaQuery('(min-width: 1280px)')

  // The panel defaults open (nice on desktop). On smaller screens it becomes a
  // drawer, so close it on first mount to avoid covering the chat on load.
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1280px)').matches) {
      setRightPanelOpen(false)
    }
  }, [setRightPanelOpen])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <CommandPalette />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[280px] max-w-[85vw]">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content — module pages render here via <Outlet /> */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <Outlet />
        </div>

        {/* Right Panel - Desktop (inline) */}
        <div className="hidden xl:block shrink-0">
          <RightPanel />
        </div>

        {/* Right Panel - Tablet & Mobile (drawer) */}
        <Sheet
          open={!isXl && rightPanelOpen}
          onOpenChange={(open) => {
            if (!open && rightPanelOpen) toggleRightPanel()
          }}
        >
          <SheetContent side="right" className="p-0 w-[360px] max-w-[85vw]">
            <RightPanel />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
