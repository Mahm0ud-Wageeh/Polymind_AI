import { useState, useRef, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { cn, generateId } from '@/lib/utils'
import type { Attachment } from '@/types'
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
  X,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const slashCommands = [
  { icon: Code, name: 'code', description: 'Generate code snippet', shortcut: '/code' },
  { icon: Image, name: 'image', description: 'Generate an image', shortcut: '/image' },
  { icon: Table, name: 'table', description: 'Create a table', shortcut: '/table' },
  { icon: FileSearch, name: 'summarize', description: 'Summarize text', shortcut: '/summarize' },
  { icon: BarChart3, name: 'analyze', description: 'Analyze data', shortcut: '/analyze' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Composer() {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // All the conversation/message/AI-reply orchestration now lives in the store
  // (backed by the swappable chat service). The Composer only owns input UI.
  const sendMessage = useStore((state) => state.sendMessage)

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const next: Attachment[] = Array.from(files).map((file) => ({
      id: generateId(),
      name: file.name,
      type: file.type || 'file',
      size: formatBytes(file.size),
      url: URL.createObjectURL(file),
    }))
    setAttachments((prev) => [...prev, ...next])
  }, [])

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed && attachments.length === 0) return

    void sendMessage(trimmed, attachments.length ? attachments : undefined)
    setInput('')
    setAttachments([])
    setShowSlashMenu(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, attachments, sendMessage])

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

  const canSend = input.trim().length > 0 || attachments.length > 0

  return (
    <div className="shrink-0 px-2 sm:px-4 pb-3 sm:pb-4 pt-2">
      <div
        className={cn(
          'max-w-3xl 2xl:max-w-4xl mx-auto bg-card border rounded-xl transition-all duration-180 ease-smooth',
          isDragging
            ? 'border-ring border-dashed ring-2 ring-ring/30'
            : isFocused
              ? 'border-ring shadow-md'
              : 'border-border shadow-sm'
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(e.dataTransfer.files)
        }}
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

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[160px]">{att.name}</span>
                <span className="text-xs text-muted-foreground">{att.size}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
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
            placeholder="Message Polymind..."
            className="w-full bg-transparent border-0 resize-none outline-none text-base leading-relaxed placeholder:text-muted-foreground min-h-[24px] max-h-[200px]"
            rows={1}
          />
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => imageInputRef.current?.click()}
              aria-label="Attach image"
            >
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
              aria-label="Voice input"
            >
              <Mic className={cn('h-4 w-4', isRecording && 'animate-pulse')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Enhance prompt"
            >
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
                canSend
                  ? 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-105'
                  : 'bg-muted text-muted-foreground'
              )}
              disabled={!canSend}
              onClick={handleSend}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {isDragging && (
        <p className="max-w-3xl 2xl:max-w-4xl mx-auto text-xs text-center text-muted-foreground mt-2 animate-fade-in">
          Drop files to attach
        </p>
      )}
    </div>
  )
}
