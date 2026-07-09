import type { Message } from '@/types'
import { generateId } from '@/lib/utils'
import { api } from '@/lib/api'
import { env } from '@/config/env'

/**
 * Chat service abstraction.
 *
 * This is the seam between the UI and the eventual backend/AI layer. Today it
 * is backed by a mock implementation, but Phase 9/10 can provide a real
 * implementation (HTTP + streaming) without touching any UI code, as long as
 * it satisfies this interface.
 */
export interface AssistantReplyParams {
  content: string
  history: Message[]
}

export interface ChatService {
  createThinkingMessage(): Message
  getAssistantReply(params: AssistantReplyParams): Promise<Message>
}

const RESPONSE_DELAY_MS = 1200

function buildMockReply(userContent: string): string {
  const topic = userContent.length > 60 ? `${userContent.slice(0, 60)}…` : userContent
  return [
    `Here is my analysis of "${topic}".`,
    '',
    '## Overview',
    '',
    'I worked through your request step by step. Here are the key points:',
    '',
    '1. **Core requirement** — the foundation of the approach.',
    '2. **Practical application** — how to put it into practice.',
    '3. **Recommendations** — best practices to follow.',
    '',
    '```typescript',
    'interface Solution {',
    '  approach: string;',
    '  implementation: string;',
    '}',
    '',
    'const solution: Solution = {',
    "  approach: 'systematic',",
    "  implementation: 'modular',",
    '};',
    '```',
    '',
    '## Next steps',
    '',
    '- Review the outline above.',
    '- Iterate on the details you care about.',
    '- Ask for a deeper dive on any point.',
  ].join('\n')
}

class MockChatService implements ChatService {
  createThinkingMessage(): Message {
    return {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isThinking: true,
      thinkingContent: 'Analyzing the request…\nGathering context…\nComposing a response…',
    }
  }

  async getAssistantReply({ content }: AssistantReplyParams): Promise<Message> {
    await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS))
    return {
      id: generateId(),
      role: 'assistant',
      content: buildMockReply(content),
      timestamp: new Date(),
    }
  }
}

/**
 * Default chat service used by the app. Swap this for a real implementation
 * (e.g. `httpChatService`) in one place once the backend from Phase 6 is ready.
 */
export const mockChatService: ChatService = new MockChatService()

/**
 * Real chat service backed by the Polymind Laravel API. It persists the
 * conversation server-side and streams the assistant reply over SSE. The
 * assembled text is returned as a single Message so it satisfies the same
 * interface the UI already consumes.
 */
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

  async getAssistantReply({ content }: AssistantReplyParams): Promise<Message> {
    const workspaceId = localStorage.getItem('polymind.workspace') ?? undefined
    const conversationId = localStorage.getItem('polymind.conversation') ?? undefined

    let text = ''
    await api.stream(
      '/chat/stream',
      { content, workspace_id: workspaceId, conversation_id: conversationId },
      (event, data) => {
        if (event === 'meta' && typeof data.conversation_id === 'string') {
          localStorage.setItem('polymind.conversation', data.conversation_id)
        } else if (event === 'delta' && typeof data.content === 'string') {
          text += data.content
        }
      },
    )

    return {
      id: generateId(),
      role: 'assistant',
      content: text,
      timestamp: new Date(),
    }
  }
}

export const httpChatService: ChatService = new HttpChatService()

/**
 * The chat service the app actually uses. Selected at build time from the
 * environment: real backend when configured, mock otherwise. UI code should
 * import this, never a concrete implementation.
 */
export const chatService: ChatService = env.useMock ? mockChatService : httpChatService
