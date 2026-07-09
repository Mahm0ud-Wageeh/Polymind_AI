import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  Search,
  MessageSquare,
  Settings,
  Plus,
  User,
  ArrowUpRight,
} from 'lucide-react'

interface CommandItem {
  id: string
  name: string
  icon: typeof MessageSquare
  shortcut?: string
  action: () => void
  group: string
}

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    conversations,
    setActiveConversation,
    createConversation,
    setCurrentPage,
    toggleCommandPalette,
  } = useStore()

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleCommandPalette()
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [commandPaletteOpen])

  const commands: CommandItem[] = [
    // Recent Conversations
    ...conversations.slice(0, 5).map((conv) => ({
      id: `conv-${conv.id}`,
      name: conv.title,
      icon: MessageSquare,
      action: () => {
        setActiveConversation(conv.id)
        setCommandPaletteOpen(false)
      },
      group: 'Recent Conversations',
    })),

    // Actions
    {
      id: 'new-chat',
      name: 'New Chat',
      icon: Plus,
      shortcut: '⌘N',
      action: () => {
        createConversation()
        setCommandPaletteOpen(false)
      },
      group: 'Actions',
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      shortcut: '⌘,',
      action: () => {
        setCurrentPage('settings')
        setCommandPaletteOpen(false)
      },
      group: 'Actions',
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: User,
      action: () => {
        setCurrentPage('settings')
        setCommandPaletteOpen(false)
      },
      group: 'Actions',
    },

    // Navigation
    {
      id: 'nav-workspace',
      name: 'Go to Workspace',
      icon: ArrowUpRight,
      action: () => {
        setCurrentPage('workspace')
        setCommandPaletteOpen(false)
      },
      group: 'Navigation',
    },
  ]

  const filteredCommands = search
    ? commands.filter((cmd) => cmd.name.toLowerCase().includes(search.toLowerCase()))
    : commands

  const grouped = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const allItems = Object.values(grouped).flat()

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = allItems[selectedIndex]
      if (item) item.action()
    }
  }

  if (!commandPaletteOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setCommandPaletteOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[640px] bg-popover rounded-2xl shadow-lg border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands, conversations, or files..."
            className="flex-1 h-14 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          <kbd
            className="text-xs bg-muted border border-border rounded px-2 py-1 font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setCommandPaletteOpen(false)}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName}>
              <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {groupName}
              </div>
              {items.map((item) => {
                const globalIndex = allItems.indexOf(item)
                return (
                  <button
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left',
                      globalIndex === selectedIndex
                        ? 'bg-accent text-accent-foreground border-l-2 border-ring'
                        : 'text-foreground hover:bg-muted'
                    )}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.shortcut && (
                      <kbd className="text-xs bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {allItems.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No results found for "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <kbd className="bg-muted border border-border rounded px-1 font-mono">↑↓</kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="bg-muted border border-border rounded px-1 font-mono">↵</kbd>
            <span>to select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="bg-muted border border-border rounded px-1 font-mono">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
