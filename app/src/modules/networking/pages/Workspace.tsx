import { ChatArea } from '@/components/chat/ChatArea'
import { Composer } from '@/components/chat/Composer'

/**
 * Workspace / AI Chat page.
 *
 * Reuses the existing ChatArea + Composer as the default view inside the
 * AppShell layout. The AppShell renders an <Outlet /> in the main content
 * area, and this page fills it with the chat experience.
 */
export default function Workspace() {
  return (
    <>
      <ChatArea />
      <Composer />
    </>
  )
}
