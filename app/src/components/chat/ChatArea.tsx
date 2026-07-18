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
  const lastMessageContent = messages[messages.length - 1]?.content

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, lastMessageContent])

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
        <div className="max-w-3xl 2xl:max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {messages.map((message, i) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={i === messages.length - 1}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
