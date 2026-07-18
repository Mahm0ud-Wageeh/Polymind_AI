import { create } from 'zustand'
import type { Conversation, Message, Project, Artifact, ProgressStep, ActivityItem, Workspace, User, Theme, PanelTab, Template, Attachment, Preferences } from '@/types'
import { generateId } from '@/lib/utils'
import { chatService } from '@/services/chat/chatService'
import { api, getToken } from '@/lib/api'
import { authService } from '@/services/auth/authService'

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
  settingsTab: string
  setSettingsTab: (tab: string) => void

  // Search
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'React Component Architecture',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isPinned: true,
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Help me design a React component architecture for a dashboard application',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: 'm2',
        role: 'assistant',
        content: `Here's a comprehensive React component architecture for a dashboard application:

## Core Structure

\`\`\`tsx
// components/
// ├── layout/
// │   ├── AppShell.tsx
// │   ├── Sidebar.tsx
// │   ├── TopBar.tsx
// │   └── Footer.tsx
// ├── dashboard/
// │   ├── DashboardGrid.tsx
// │   ├── StatCard.tsx
// │   ├── ChartWidget.tsx
// │   └── RecentActivity.tsx
// ├── shared/
// │   ├── Button.tsx
// │   ├── Card.tsx
// │   ├── Input.tsx
// │   └── Modal.tsx
// └── hooks/
    ├── useAuth.ts
    ├── useTheme.ts
    └── useDashboard.ts
\`\`\`

## Key Principles

1. **Container/Presentational Pattern** - Separate data fetching from UI rendering
2. **Compound Components** - For complex UI like DashboardGrid with customizable widgets
3. **Custom Hooks** - Extract reusable logic (useTheme, useAuth, useFetch)
4. **Context API** - For global state (theme, auth, notifications)

## Example Implementation

The \`AppShell\` component serves as the main layout wrapper, managing the sidebar state and responsive breakpoints. It uses CSS Grid for the three-column layout and handles collapse/expand animations.`,
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
      },
    ],
  },
  {
    id: '2',
    title: 'Python Data Analysis Script',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'Write a Python script to analyze a CSV file and generate summary statistics',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: 'm4',
        role: 'assistant',
        content: 'Here\'s a comprehensive Python script for CSV data analysis:\n\n```python\nimport pandas as pd\nimport numpy as np\nfrom datetime import datetime\n\ndef analyze_csv(filepath):\n    """Analyze a CSV file and generate summary statistics."""\n    df = pd.read_csv(filepath)\n    \n    print(f"Dataset Shape: {df.shape}")\n    print(f"\nColumn Types:")\n    print(df.dtypes)\n    \n    return df.describe()\n```\n\nThis script provides comprehensive analysis including descriptive statistics, missing value detection, and correlation matrices.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
      },
    ],
  },
  {
    id: '3',
    title: 'API Design Best Practices',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    messages: [
      {
        id: 'm5',
        role: 'user',
        content: 'What are REST API design best practices?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        id: 'm6',
        role: 'assistant',
        content: 'Here are the key REST API design best practices:\n\n1. **Use Nouns for Resources** - `/users` not `/getUsers`\n2. **Use HTTP Methods Correctly** - GET, POST, PUT, DELETE\n3. **Version Your API** - `/api/v1/users`\n4. **Use Query Parameters for Filtering** - `/users?role=admin`\n5. **Return Proper Status Codes** - 200, 201, 400, 404, 500\n6. **Support Pagination** - `?page=1&limit=20`\n7. **Use Consistent Naming** - snake_case or camelCase\n8. **Document with OpenAPI/Swagger**',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
    ],
  },
  {
    id: '4',
    title: 'Database Schema Design',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messages: [],
  },
  {
    id: '5',
    title: 'CI/CD Pipeline Setup',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    messages: [],
  },
]

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'E-Commerce Platform',
    conversations: [
      { id: 'p1c1', title: 'Product API Design', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), messages: [] },
      { id: 'p1c2', title: 'Cart Service Logic', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), messages: [] },
    ],
  },
  {
    id: 'p2',
    name: 'Mobile App',
    conversations: [
      { id: 'p2c1', title: 'Auth Flow', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), messages: [] },
    ],
  },
]

// Kept temporarily for a backwards-compatible persisted-state migration. They
// are no longer inserted into the running application state.
void mockConversations
void mockProjects

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
    const reply = await chatService.getAssistantReply({ content: trimmed, history, fileIds })
    setMessages(conversationId, (messages) =>
      messages.filter((m) => m.id !== thinking.id).concat(reply)
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
    const reply = await chatService.getAssistantReply({ content: userMsg.content, history })
    setMessages(convId, (messages) =>
      messages.filter((m) => m.id !== thinking.id).concat(reply)
    )
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
    const reply = await chatService.getAssistantReply({ content: trimmed, history })
    setMessages(convId, (messages) =>
      messages.filter((m) => m.id !== thinking.id).concat(reply)
    )
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
}))
