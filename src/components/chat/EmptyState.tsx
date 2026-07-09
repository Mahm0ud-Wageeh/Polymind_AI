import { useStore } from '@/store/useStore'
import { Logo } from '@/components/shell/Logo'
import {
  BarChart3,
  Code2,
  FileText,
  Presentation,
  Lightbulb,
  Bug,
} from 'lucide-react'

const suggestions = [
  { icon: BarChart3, title: 'Analyze a dataset', prompt: 'Help me analyze this sales dataset and find trends' },
  { icon: Code2, title: 'Write code', prompt: 'Write a Python function to parse JSON data' },
  { icon: FileText, title: 'Summarize a document', prompt: 'Summarize the key points of this article' },
  { icon: Presentation, title: 'Create a presentation', prompt: 'Create an outline for a presentation about AI' },
  { icon: Lightbulb, title: 'Brainstorm ideas', prompt: 'Help me brainstorm marketing ideas for a SaaS product' },
  { icon: Bug, title: 'Debug an error', prompt: 'Help me debug this React error' },
]

export function EmptyState() {
  // Reuse the single source of truth for sending messages instead of
  // duplicating conversation-creation and fake-AI logic here.
  const sendMessage = useStore((state) => state.sendMessage)

  const handleSuggestion = (prompt: string) => {
    void sendMessage(prompt)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <Logo size="lg" className="justify-center mb-4" />
        <h2 className="text-2xl font-semibold mb-2">What can I help you with today?</h2>
        <p className="text-muted-foreground">Start a conversation or try one of these:</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.title}
            className="flex items-center gap-3 p-4 text-left border border-border rounded-xl bg-background hover:bg-accent hover:shadow-sm transition-all group"
            onClick={() => handleSuggestion(suggestion.prompt)}
          >
            <suggestion.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            <span className="text-sm font-medium">{suggestion.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
