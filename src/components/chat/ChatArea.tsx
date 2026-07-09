import { useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { ChatMessage } from './ChatMessage'
import { EmptyState } from './EmptyState'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ChatArea() {
  const { conversations, activeConversationId } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find((c) => c.id === activeConversationId)
  const messages = activeConv?.messages || []

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, messages[messages.length - 1]?.content])

  if (!activeConv || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
