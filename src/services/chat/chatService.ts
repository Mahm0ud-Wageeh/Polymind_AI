import type { Message } from '@/types'
import { generateId } from '@/lib/utils'

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
