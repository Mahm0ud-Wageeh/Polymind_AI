import { useStore } from '@/store/useStore'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ChatArea } from '@/components/chat/ChatArea'
import { Composer } from '@/components/chat/Composer'
import { RightPanel } from '@/components/panel/RightPanel'
import { CommandPalette } from '@/components/command/CommandPalette'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export function AppShell() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useStore()

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
          <SheetContent side="left" className="p-0 w-[280px]">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <ChatArea />
          <Composer />
        </div>

        {/* Right Panel - Desktop */}
        <div className="hidden xl:block shrink-0">
          <RightPanel />
        </div>
      </div>
    </div>
  )
}
