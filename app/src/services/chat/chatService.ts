import type { Message } from '@/types'
import { generateId } from '@/lib/utils'
import { api } from '@/lib/api'

export interface AssistantReplyParams {
  content: string
  history: Message[]
  fileIds?: string[]
}

export interface ChatService {
  createThinkingMessage(): Message
  getAssistantReply(params: AssistantReplyParams): Promise<Message>
}

/** Persists a request and receives its streamed reply from the Laravel API. */
class HttpChatService implements ChatService {
  createThinkingMessage(): Message {
    return {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isThinking: true,
      thinkingContent: 'Contacting Polymind…',
    }
  }

  async getAssistantReply({ content, fileIds }: AssistantReplyParams): Promise<Message> {
    const workspaceId = localStorage.getItem('polymind.workspace') ?? undefined
    const conversationId = localStorage.getItem('polymind.conversation') ?? undefined
    let text = ''

    await api.stream(
      '/chat/stream',
      { content, workspace_id: workspaceId, conversation_id: conversationId, file_ids: fileIds },
      (event, data) => {
        if (event === 'meta' && typeof data.conversation_id === 'string') {
          localStorage.setItem('polymind.conversation', data.conversation_id)
        }
        if (event === 'delta' && typeof data.content === 'string') text += data.content
      },
    )

    return { id: generateId(), role: 'assistant', content: text, timestamp: new Date() }
  }
}

export const chatService: ChatService = new HttpChatService()
