import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  PanelRightOpen,
  PanelRightClose,
  Search,
  Menu,
} from 'lucide-react'
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
    <header className="h-12 border-b border-border bg-background flex items-center px-4 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <h1 className="text-base font-medium truncate">
          {activeConv?.title || 'NetTopo AI'}
        </h1>
      </div>

      {/* Center */}
      <div className="hidden md:flex items-center text-sm text-muted-foreground">
        <span>AI Workspace</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 hidden lg:flex',
            rightPanelOpen && 'text-ring'
          )}
          onClick={toggleRightPanel}
        >
          {rightPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium ml-1">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}
