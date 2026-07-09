import { useState, useRef, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  Paperclip,
  Image,
  Mic,
  Sparkles,
  ArrowUp,
  Code,
  Table,
  FileSearch,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const slashCommands = [
  { icon: Code, name: 'code', description: 'Generate code snippet', shortcut: '/code' },
  { icon: Image, name: 'image', description: 'Generate an image', shortcut: '/image' },
  { icon: Table, name: 'table', description: 'Create a table', shortcut: '/table' },
  { icon: FileSearch, name: 'summarize', description: 'Summarize text', shortcut: '/summarize' },
  { icon: BarChart3, name: 'analyze', description: 'Analyze data', shortcut: '/analyze' },
]

export function Composer() {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // All the conversation/message/AI-reply orchestration now lives in the store
  // (backed by the swappable chat service). The Composer only owns input UI.
  const sendMessage = useStore((state) => state.sendMessage)

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return

    void sendMessage(trimmed)
    setInput('')
    setShowSlashMenu(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)

    if (value === '/') {
      setShowSlashMenu(true)
    } else if (!value.startsWith('/')) {
      setShowSlashMenu(false)
    }

    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const handleSlashCommand = (command: string) => {
    setInput(command + ' ')
    setShowSlashMenu(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div
        className={cn(
          'max-w-3xl mx-auto bg-card border rounded-xl transition-all duration-180',
          isFocused ? 'border-ring shadow-md' : 'border-border shadow-sm'
        )}
      >
        {/* Slash Commands Menu */}
        {showSlashMenu && (
          <div className="border-b border-border p-2">
            <div className="text-xs text-muted-foreground mb-2 px-2">Commands</div>
            {slashCommands.map((cmd) => (
              <button
                key={cmd.name}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                onClick={() => handleSlashCommand(cmd.shortcut)}
              >
                <cmd.icon className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">{cmd.name}</div>
                  <div className="text-xs text-muted-foreground">{cmd.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="px-4 pt-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Message NetTopo..."
            className="w-full bg-transparent border-0 resize-none outline-none text-base leading-relaxed placeholder:text-muted-foreground min-h-[24px] max-h-[200px]"
            rows={1}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                isRecording ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setIsRecording(!isRecording)}
            >
              <Mic className={cn('h-4 w-4', isRecording && 'animate-pulse')} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {input.length > 400 && (
              <span className="text-xs text-muted-foreground">{input.length}/2000</span>
            )}
            <Button
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full transition-all',
                input.trim()
                  ? 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-105'
                  : 'bg-muted text-muted-foreground'
              )}
              disabled={!input.trim()}
              onClick={handleSend}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
