import type {
  Conversation,
  Project,
  Template,
  Artifact,
  ProgressStep,
  ActivityItem,
} from "@/types"

export const mockConversations: Conversation[] = [
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

export const mockProjects: Project[] = [
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

export const mockTemplates: Template[] = [
  { id: 't1', name: 'Code Review', icon: 'code', description: 'Review code for quality and bugs' },
  { id: 't2', name: 'Debug Helper', icon: 'bug', description: 'Debug errors and find solutions' },
  { id: 't3', name: 'Explain Code', icon: 'book-open', description: 'Explain what code does' },
  { id: 't4', name: 'Refactor', icon: 'refresh-cw', description: 'Refactor and improve code' },
  { id: 't5', name: 'Write Tests', icon: 'check-circle', description: 'Generate unit tests' },
  { id: 't6', name: 'Documentation', icon: 'file-text', description: 'Write documentation' },
]

export const mockArtifacts: Artifact[] = [
  { id: 'a1', name: 'Dashboard.tsx', type: 'code', language: 'tsx', size: '3.2 KB' },
  { id: 'a2', name: 'api-client.ts', type: 'code', language: 'typescript', size: '1.8 KB' },
  { id: 'a3', name: 'schema.sql', type: 'code', language: 'sql', size: '2.1 KB' },
  { id: 'a4', name: 'architecture.md', type: 'document', size: '4.5 KB', preview: 'System architecture overview...' },
]

export const mockProgressSteps: ProgressStep[] = [
  { id: 'ps1', name: 'Analyzing request', status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: 'ps2', name: 'Generating response', status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 4) },
  { id: 'ps3', name: 'Formatting code blocks', status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 3) },
  { id: 'ps4', name: 'Creating artifacts', status: 'running', timestamp: new Date(Date.now() - 1000 * 60 * 2) },
]

export const mockActivityItems: ActivityItem[] = [
  { id: 'ac1', description: 'Generated 3 code blocks', timestamp: new Date(Date.now() - 1000 * 60 * 2), icon: 'code' },
  { id: 'ac2', description: 'Analyzed dataset.csv', timestamp: new Date(Date.now() - 1000 * 60 * 5), icon: 'file' },
  { id: 'ac3', description: 'Created summary.md', timestamp: new Date(Date.now() - 1000 * 60 * 10), icon: 'file-text' },
  { id: 'ac4', description: 'Refactored api-client.ts', timestamp: new Date(Date.now() - 1000 * 60 * 15), icon: 'refresh-cw' },
]

