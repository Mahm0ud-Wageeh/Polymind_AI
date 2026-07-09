import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { PanelRightOpen, PanelRightClose, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const {
    rightPanelOpen,
    toggleRightPanel,
    setCommandPaletteOpen,
    setMobileSidebarOpen,
    conversations,
    activeConversationId,
    user,
  } = useStore()

  const activeConv = conversations.find((c) => c.id === activeConversationId)

  return (
    <header className="h-12 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-2 sm:px-4 shrink-0 z-sticky">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 shrink-0"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <h1 className="text-sm sm:text-base font-medium truncate">
          {activeConv?.title || 'Polymind AI'}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', rightPanelOpen && 'text-ring')}
          onClick={toggleRightPanel}
          aria-label="Toggle context panel"
        >
          {rightPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-medium ml-1 ring-1 ring-border select-none">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}
