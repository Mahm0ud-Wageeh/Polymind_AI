import { create } from 'zustand'
import type { Conversation, Message, Project, Artifact, ProgressStep, ActivityItem, Workspace, User, Theme, PanelTab, Template } from '@/types'
import { generateId } from '@/lib/utils'
import { mockChatService } from '@/services/chat/chatService'
import {
  mockConversations,
  mockProjects,
  mockTemplates,
  mockArtifacts,
  mockProgressSteps,
  mockActivityItems,
} from '@/data/mockData'

interface AppState {
  // Navigation
  currentPage: 'auth' | 'onboarding' | 'workspace' | 'settings'
  setCurrentPage: (page: 'auth' | 'onboarding' | 'workspace' | 'settings') => void

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
  activePanelTab: PanelTab
  setActivePanelTab: (tab: PanelTab) => void

  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
  createConversation: () => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  appendMessage: (conversationId: string, message: Message) => void
  setMessages: (conversationId: string, updater: (messages: Message[]) => Message[]) => void
  sendMessage: (content: string) => Promise<void>

  // Projects
  projects: Project[]

  // Workspace
  currentWorkspace: Workspace
  workspaces: Workspace[]

  // User
  user: User | null
  setUser: (user: User | null) => void

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
        content: `Here\'s a comprehensive React component architecture for a dashboard application:

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

const mockTemplates: Template[] = [
  { id: 't1', name: 'Code Review', icon: 'code', description: 'Review code for quality and bugs' },
  { id: 't2', name: 'Debug Helper', icon: 'bug', description: 'Debug errors and find solutions' },
  { id: 't3', name: 'Explain Code', icon: 'book-open', description: 'Explain what code does' },
  { id: 't4', name: 'Refactor', icon: 'refresh-cw', description: 'Refactor and improve code' },
  { id: 't5', name: 'Write Tests', icon: 'check-circle', description: 'Generate unit tests' },
  { id: 't6', name: 'Documentation', icon: 'file-text', description: 'Write documentation' },
]

const mockArtifacts: Artifact[] = [
  { id: 'a1', name: 'Dashboard.tsx', type: 'code', language: 'tsx', size: '3.2 KB' },
  { id: 'a2', name: 'api-client.ts', type: 'code', language: 'typescript', size: '1.8 KB' },
  { id: 'a3', name: 'schema.sql', type: 'code', language: 'sql', size: '2.1 KB' },
  { id: 'a4', name: 'architecture.md', type: 'document', size: '4.5 KB', preview: 'System architecture overview...' },
]

const mockProgressSteps: ProgressStep[] = [
  { id: 'ps1', name: 'Analyzing request', status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: 'ps2', name: 'Generating response', status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 4) },
  { id: 'ps3', name: 'Formatting code blocks', status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 3) },
  { id: 'ps4', name: 'Creating artifacts', status: 'running', timestamp: new Date(Date.now() - 1000 * 60 * 2) },
]

const mockActivityItems: ActivityItem[] = [
  { id: 'ac1', description: 'Generated 3 code blocks', timestamp: new Date(Date.now() - 1000 * 60 * 2), icon: 'code' },
  { id: 'ac2', description: 'Analyzed dataset.csv', timestamp: new Date(Date.now() - 1000 * 60 * 5), icon: 'file' },
  { id: 'ac3', description: 'Created summary.md', timestamp: new Date(Date.now() - 1000 * 60 * 10), icon: 'file-text' },
  { id: 'ac4', description: 'Refactored api-client.ts', timestamp: new Date(Date.now() - 1000 * 60 * 15), icon: 'refresh-cw' },
]

export const useStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'workspace',
  setCurrentPage: (page) => set({ currentPage: page }),

  // Theme
  theme: 'system',
  setTheme: (theme) => {
    set({ theme })
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

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  // Right panel
  rightPanelOpen: true,
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  activePanelTab: 'artifacts',
  setActivePanelTab: (tab) => set({ activePanelTab: tab }),

  // Conversations
  conversations: mockConversations,
  activeConversationId: '1',
  setActiveConversation: (id) => set({ activeConversationId: id }),
  createConversation: () => {
    const newConv: Conversation = {
      id: generateId(),
      title: 'New Conversation',
      timestamp: new Date(),
      messages: [],
    }
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: newConv.id,
    }))
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
  sendMessage: async (content) => {
    const trimmed = content.trim()
    if (!trimmed) return
    const { activeConversationId, conversations, appendMessage, setMessages } = get()
    let conversationId = activeConversationId
    const activeConv = conversations.find((c) => c.id === conversationId)
    const title = trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '')
    if (!activeConv) {
      const created: Conversation = {
        id: generateId(),
        title,
        timestamp: new Date(),
        messages: [],
      }
      set((state) => ({
        conversations: [created, ...state.conversations],
        activeConversationId: created.id,
      }))
      conversationId = created.id
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
    }
    appendMessage(conversationId, userMessage)
    const thinking = mockChatService.createThinkingMessage()
    appendMessage(conversationId, thinking)
    const history =
      get().conversations.find((c) => c.id === conversationId)?.messages ?? []
    const reply = await mockChatService.getAssistantReply({ content: trimmed, history })
    setMessages(conversationId, (messages) =>
      messages.filter((m) => m.id !== thinking.id).concat(reply)
    )
  },

  // Projects
  projects: mockProjects,

  // Workspace
  currentWorkspace: { id: 'w1', name: 'Personal Workspace' },
  workspaces: [
    { id: 'w1', name: 'Personal Workspace' },
    { id: 'w2', name: 'Team Workspace' },
  ],

  // User
  user: {
    id: 'u1',
    name: 'Alex Chen',
    email: 'alex@nettopo.ai',
    role: 'Admin',
  },
  setUser: (user) => set({ user }),

  // Artifacts
  artifacts: mockArtifacts,

  // Progress
  progressSteps: mockProgressSteps,

  // Activity
  activityItems: mockActivityItems,

  // Templates
  templates: mockTemplates,

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  // Onboarding
  onboardingStep: 1,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  completeOnboarding: () => set({ currentPage: 'workspace', onboardingStep: 1 }),

  // Settings
  settingsTab: 'account',
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  // Search
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
}))
