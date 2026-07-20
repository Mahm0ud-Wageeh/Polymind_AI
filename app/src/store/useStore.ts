import { create } from 'zustand'
import type { Conversation, Message, Project, Artifact, ProgressStep, ActivityItem, Workspace, User, Theme, PanelTab, SettingsTab, Template, Attachment, Preferences } from '@/types'
import { generateId } from '@/lib/utils'
import { chatService } from '@/services/chat/chatService'
import { api, getToken } from '@/lib/api'
import { authService } from '@/services/auth/authService'
import { agentsService, type Agent } from '@/services/agents/agentsService'


// يبث رد المساعد "حرف بحرف" جوه المحادثة: بيستبدل فقاعة "التفكير"
// برسالة بتتحدّث مع كل token، وفي الآخر بيثبّت النسخة النهائية.
async function streamReplyInto(
  conversationId: string,
  thinkingId: string,
  params: { content: string; history: Message[]; fileIds?: string[]; agentId?: string },
  setMessages: (conversationId: string, updater: (messages: Message[]) => Message[]) => void,
): Promise<void> {
  const streamingId = generateId()
  let started = false

  const reply = await chatService.getAssistantReply({
    ...params,
    onDelta: (text) => {
      setMessages(conversationId, (messages) => {
        if (!started) {
          started = true
          return messages
            .filter((m) => m.id !== thinkingId)
            .concat({ id: streamingId, role: 'assistant', content: text, timestamp: new Date(), isStreaming: true })
        }
        return messages.map((m) => (m.id === streamingId ? { ...m, content: text } : m))
      })
    },
  })

  setMessages(conversationId, (messages) =>
    messages
      .filter((m) => m.id !== thinkingId && m.id !== streamingId)
      .concat({ ...reply, id: streamingId, isStreaming: false }),
  )
}

interface AppState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void

  // Right panel
  rightPanelOpen: boolean
  toggleRightPanel: () => void
  setRightPanelOpen: (open: boolean) => void
  activePanelTab: PanelTab
  setActivePanelTab: (tab: PanelTab) => void

  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => Promise<void>
  createConversation: () => Promise<void>
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  appendMessage: (conversationId: string, message: Message) => void
  setMessages: (conversationId: string, updater: (messages: Message[]) => Message[]) => void
  sendMessage: (content: string, attachments?: Attachment[], fileIds?: string[]) => Promise<void>
  deleteMessage: (messageId: string) => void
  toggleReaction: (messageId: string, reaction: 'up' | 'down') => void
  regenerateResponse: () => Promise<void>
  editAndResend: (messageId: string, newContent: string) => Promise<void>

  // Projects
  projects: Project[]

  // Workspace
  currentWorkspace: Workspace
  workspaces: Workspace[]
  updateWorkspace: (patch: Partial<Workspace>) => void

  // User
  user: User | null
  setUser: (user: User | null) => void
  hydrate: () => Promise<void>
  updateUserProfile: (patch: Partial<User>) => void

  // Preferences
  preferences: Preferences
  updatePreferences: (patch: Partial<Preferences>) => void

  // Artifacts
  artifacts: Artifact[]

  // Progress
  progressSteps: ProgressStep[]

  // Activity
  activityItems: ActivityItem[]

  // Templates
  templates: Template[]

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void

  // Onboarding
  onboardingStep: number
  setOnboardingStep: (step: number) => void
  completeOnboarding: () => void

  // Settings
  settingsTab: SettingsTab
  setSettingsTab: (tab: SettingsTab) => void

  // Search
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void

  // Agents
  agents: Agent[]
  activeAgentId: string | null
  setActiveAgent: (id: string | null) => void
  loadAgents: () => Promise<void>
}

const PREFS_KEY = 'polymind:preferences'
const THEME_KEY = 'polymind:theme'

const defaultPreferences: Preferences = {
  reducedMotion: false,
  defaultModel: 'GPT-4o',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'You are a helpful AI assistant.',
  notifications: {
    newMessages: true,
    mentions: true,
    taskCompletions: false,
    systemUpdates: true,
    marketingEmails: false,
  },
}

function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return defaultPreferences
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return defaultPreferences
    const parsed = JSON.parse(raw)
    return {
      ...defaultPreferences,
      ...parsed,
      notifications: {
        ...defaultPreferences.notifications,
        ...(parsed?.notifications ?? {}),
      },
    }
  } catch {
    return defaultPreferences
  }
}

function savePreferences(prefs: Preferences): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    const t = window.localStorage.getItem(THEME_KEY)
    if (t === 'light' || t === 'dark' || t === 'system') return t
  } catch {
    /* ignore */
  }
  return 'system'
}

export const useStore = create<AppState>((set, get) => ({
  // Theme
  theme: loadTheme(),
  setTheme: (theme) => {
    set({ theme })
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore persistence errors */
    }
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      set({ isDarkMode: true })
    } else {
      document.documentElement.classList.remove('dark')
      set({ isDarkMode: false })
    }
  },
  isDarkMode: false,
  setIsDarkMode: (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ isDarkMode: isDark })
  },

  // Preferences
  preferences: loadPreferences(),
  updatePreferences: (patch) =>
    set((state) => {
      const next = {
        ...state.preferences,
        ...patch,
        notifications: {
          ...state.preferences.notifications,
          ...(patch.notifications ?? {}),
        },
      }
      savePreferences(next)
      return { preferences: next }
    }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  // Right panel
  rightPanelOpen: true,
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  activePanelTab: 'artifacts',
  setActivePanelTab: (tab) => set({ activePanelTab: tab }),

  // Conversations
  conversations: [],
  activeConversationId: null,
  setActiveConversation: async (id) => {
    if (!id) {
      set({ activeConversationId: null })
      localStorage.removeItem('polymind.conversation')
      return
    }
    const response = await api.get<{ id: string; title: string; last_message_at?: string; messages?: Array<{ id: string; role: Message['role']; content: string; created_at: string }> }>(`/conversations/${id}`)
    const messages = (response.messages ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.created_at),
    }))
    set((state) => ({
      activeConversationId: id,
      conversations: state.conversations.map((conversation) => conversation.id === id ? { ...conversation, messages } : conversation),
    }))
    localStorage.setItem('polymind.conversation', id)
  },
  createConversation: async () => {
    const workspaceId = get().currentWorkspace.id || localStorage.getItem('polymind.workspace')
    if (!workspaceId) throw new Error('No workspace selected.')
    const created = await api.post<{ id: string; title: string; created_at: string }>('/conversations', { workspace_id: workspaceId, title: 'New chat' })
    const newConv: Conversation = { id: created.id, title: created.title, timestamp: new Date(created.created_at), messages: [] }
    set((state) => ({ conversations: [newConv, ...state.conversations], activeConversationId: newConv.id }))
    localStorage.setItem('polymind.conversation', newConv.id)
  },
  addMessage: (message) => {
    const state = get()
    const convId = state.activeConversationId
    if (!convId) return
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === convId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      ),
    }))
  },
  updateMessage: (id, updates) => {
    const state = get()
    const convId = state.activeConversationId
    if (!convId) return
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === convId
          ? {
            ...conv,
            messages: conv.messages.map((msg) =>
              msg.id === id ? { ...msg, ...updates } : msg
            ),
          }
          : conv
      ),
    }))
  },
  appendMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      ),
    })),
  setMessages: (conversationId, updater) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ),
    })),
  sendMessage: async (content, attachments, fileIds) => {
    const trimmed = content.trim()
    if (!trimmed && (!attachments || attachments.length === 0)) return
    const { activeConversationId, conversations, appendMessage, setMessages } = get()
    let conversationId = activeConversationId
    const activeConv = conversations.find((c) => c.id === conversationId)
    const title = trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '')
    if (!activeConv) {
      await get().createConversation()
      conversationId = get().activeConversationId
    } else if (activeConv.messages.length === 0) {
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === activeConv.id ? { ...conv, title } : conv
        ),
      }))
      conversationId = activeConv.id
    }
    if (!conversationId) return
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      attachments,
    }
    appendMessage(conversationId, userMessage)
    const thinking = chatService.createThinkingMessage()
    appendMessage(conversationId, thinking)
    const history =
      get().conversations.find((c) => c.id === conversationId)?.messages ?? []

    await streamReplyInto(
      conversationId,
      thinking.id,
      { content: trimmed, history, fileIds, agentId: get().activeAgentId ?? undefined },
      setMessages,
    )
  },
  deleteMessage: (messageId) => {
    const convId = get().activeConversationId
    if (!convId) return
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === convId
          ? { ...conv, messages: conv.messages.filter((m) => m.id !== messageId) }
          : conv
      ),
    }))
  },
  toggleReaction: (messageId, reaction) => {
    const convId = get().activeConversationId
    if (!convId) return
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === convId
          ? {
            ...conv,
            messages: conv.messages.map((m) =>
              m.id === messageId
                ? { ...m, reaction: m.reaction === reaction ? undefined : reaction }
                : m
            ),
          }
          : conv
      ),
    }))
  },
  regenerateResponse: async () => {
    const { activeConversationId, conversations, setMessages, appendMessage } = get()
    const convId = activeConversationId
    if (!convId) return
    const conv = conversations.find((c) => c.id === convId)
    if (!conv) return
    const lastUserIdx = conv.messages.map((m) => m.role).lastIndexOf('user')
    if (lastUserIdx === -1) return
    const userMsg = conv.messages[lastUserIdx]
    setMessages(convId, (msgs) => msgs.slice(0, lastUserIdx + 1))
    const thinking = chatService.createThinkingMessage()
    appendMessage(convId, thinking)
    const history = get().conversations.find((c) => c.id === convId)?.messages ?? []
    await streamReplyInto(convId, thinking.id, { content: userMsg.content, history }, setMessages)
  },
  editAndResend: async (messageId, newContent) => {
    const trimmed = newContent.trim()
    if (!trimmed) return
    const { activeConversationId, conversations, setMessages, appendMessage } = get()
    const convId = activeConversationId
    if (!convId) return
    const conv = conversations.find((c) => c.id === convId)
    if (!conv) return
    const idx = conv.messages.findIndex((m) => m.id === messageId)
    if (idx === -1) return
    setMessages(convId, (msgs) =>
      msgs
        .slice(0, idx + 1)
        .map((m) => (m.id === messageId ? { ...m, content: trimmed } : m))
    )
    const thinking = chatService.createThinkingMessage()
    appendMessage(convId, thinking)
    const history = get().conversations.find((c) => c.id === convId)?.messages ?? []
    await streamReplyInto(convId, thinking.id, { content: trimmed, history }, setMessages)
  },

  // Projects
  projects: [],

  // Workspace
  currentWorkspace: { id: '', name: '' },
  updateWorkspace: (patch) =>
    set((state) => ({ currentWorkspace: { ...state.currentWorkspace, ...patch } })),
  workspaces: [],

  // User
  user: null,
  setUser: (user) => set({ user }),
  hydrate: async () => {
    if (!getToken()) return
    const [user, workspaces, conversationResponse, projectResponse] = await Promise.all([
      authService.me(),
      api.get<Array<{ id: string; name: string }>>('/workspaces'),
      api.get<{ data?: Array<{ id: string; title: string; last_message_at?: string; is_pinned?: boolean; project_id?: string }> } | Array<{ id: string; title: string; last_message_at?: string; is_pinned?: boolean; project_id?: string }>>('/conversations'),
      api.get<Array<{ id: string; name: string }>>(`/projects?workspace_id=${encodeURIComponent(localStorage.getItem('polymind.workspace') ?? '')}`),
    ])
    const rawConversations = Array.isArray(conversationResponse) ? conversationResponse : conversationResponse.data ?? []
    const conversations = rawConversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      timestamp: conversation.last_message_at ? new Date(conversation.last_message_at) : new Date(),
      isPinned: conversation.is_pinned,
      projectId: conversation.project_id,
      messages: [],
    }))
    const selectedWorkspace = workspaces.find((workspace) => workspace.id === localStorage.getItem('polymind.workspace')) ?? workspaces[0]
    if (selectedWorkspace) localStorage.setItem('polymind.workspace', selectedWorkspace.id)
    set({
      user,
      workspaces,
      currentWorkspace: selectedWorkspace ?? { id: '', name: '' },
      conversations,
      projects: projectResponse.map((project) => ({ id: project.id, name: project.name, conversations: [] })),
      activeConversationId: null,
    })

    void get().loadAgents().catch(() => undefined)

  },
  updateUserProfile: (patch) =>
    set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),

  // Artifacts
  artifacts: [],

  // Progress
  progressSteps: [],

  // Activity
  activityItems: [],

  // Templates
  templates: [],

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  // Onboarding
  onboardingStep: 1,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  completeOnboarding: () => set({ onboardingStep: 1 }),

  // Settings
  settingsTab: 'account',
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  // Search
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Agents
  agents: [],
  activeAgentId: (typeof window !== 'undefined' && localStorage.getItem('polymind.agent')) || null,
  setActiveAgent: (id) => {
    set({ activeAgentId: id })
    if (id) localStorage.setItem('polymind.agent', id)
    else localStorage.removeItem('polymind.agent')
  },
  loadAgents: async () => {
    const agents = await agentsService.list()
    set({ agents })
  },
}))
