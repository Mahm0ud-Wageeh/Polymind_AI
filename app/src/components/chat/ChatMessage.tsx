import { useEffect, useState } from 'react'
import type { Message } from '@/types'
import { cn, formatTime } from '@/lib/utils'
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ChevronDown,
  Bot,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'

interface ChatMessageProps {
  message: Message
  isLast?: boolean
}

// Copy-to-clipboard button for code blocks, with a brief visual confirmation.
function CopyCodeButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="hover:text-white transition-colors flex items-center gap-1"
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      aria-label="Copy code"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// Renders a Mermaid diagram from a ```mermaid code block. Mermaid is imported
// lazily so it never weighs down the initial bundle.
function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('mermaid')
      .then((mod) => {
        const mermaid = mod.default
        mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' })
        return mermaid.render('mmd-' + Math.random().toString(36).slice(2), chart)
      })
      .then((res) => {
        if (!cancelled) setSvg(res.svg)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [chart])

  if (failed) {
    return (
      <pre className="my-4 p-4 rounded-lg border border-border bg-[#1E1E1E] text-sm font-mono text-gray-300 overflow-x-auto">
        {chart}
      </pre>
    )
  }
  return (
    <div
      className="my-4 flex justify-center overflow-x-auto rounded-lg border border-border bg-card p-4"
      dangerouslySetInnerHTML={ { __html: svg } }
    />
  )
}

// Strongly-typed renderers for the Markdown output. Declaring the object as
// `Components` lets TypeScript infer each renderer's props, so we no longer
// need `any` anywhere in this file.
const markdownComponents: Components = {
  code(props) {
    const { className, children } = props
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !className
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">{children}</code>
      )
    }
    const lang = match ? match[1] : 'text'
    const codeString = String(children).replace(/\n$/, '')
    if (lang === 'mermaid') {
      return <MermaidDiagram chart={codeString} />
    }
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-border">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1E1E1E] text-gray-400 text-xs">
          <span>{lang}</span>
          <CopyCodeButton value={codeString} />
        </div>
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={ { margin: 0, background: '#1E1E1E', padding: '1rem', fontSize: '0.875rem' } }
          PreTag="div"
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    )
  },
  table(props) {
    return (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          {props.children}
        </table>
      </div>
    )
  },
  thead(props) {
    return <thead className="bg-muted">{props.children}</thead>
  },
  th(props) {
    return (
      <th className="border border-border px-3 py-2 text-left font-medium text-foreground">
        {props.children}
      </th>
    )
  },
  td(props) {
    return (
      <td className="border border-border px-3 py-2 text-muted-foreground">
        {props.children}
      </td>
    )
  },
  h1(props) {
    return <h1 className="text-2xl font-semibold mt-6 mb-3">{props.children}</h1>
  },
  h2(props) {
    return <h2 className="text-xl font-semibold mt-5 mb-2">{props.children}</h2>
  },
  h3(props) {
    return <h3 className="text-lg font-medium mt-4 mb-2">{props.children}</h3>
  },
  p(props) {
    return <p className="mb-3 leading-relaxed">{props.children}</p>
  },
  ul(props) {
    return <ul className="list-disc pl-5 mb-3 space-y-1">{props.children}</ul>
  },
  ol(props) {
    return <ol className="list-decimal pl-5 mb-3 space-y-1">{props.children}</ol>
  },
  li(props) {
    return <li className="text-muted-foreground">{props.children}</li>
  },
  blockquote(props) {
    return (
      <blockquote className="border-l-2 border-ring pl-4 py-1 my-3 text-muted-foreground italic">
        {props.children}
      </blockquote>
    )
  },
  hr() {
    return <hr className="my-4 border-border" />
  },
  a(props) {
    return (
      <a
        href={props.href}
        className="text-ring hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.children}
      </a>
    )
  },
}

export function ChatMessage({ message, isLast = false }: ChatMessageProps) {
  const [showThinking, setShowThinking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)

  const deleteMessage = useStore((s) => s.deleteMessage)
  const toggleReaction = useStore((s) => s.toggleReaction)
  const regenerateResponse = useStore((s) => s.regenerateResponse)
  const editAndResend = useStore((s) => s.editAndResend)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submitEdit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setIsEditing(false)
    void editAndResend(message.id, trimmed)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setDraft(message.content)
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6 group">
        <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end gap-1">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate max-w-[200px]">{att.name}</span>
                </div>
              ))}
            </div>
          )}

          {isEditing ? (
            <div className="w-full min-w-[280px] bg-card border border-border rounded-2xl p-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submitEdit()
                  }
                  if (e.key === 'Escape') cancelEdit()
                }}
                className="w-full bg-transparent outline-none resize-none text-base leading-relaxed p-2 min-h-[60px]"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-1">
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={submitEdit} disabled={!draft.trim()}>
                  Send
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground px-1">
              {formatTime(message.timestamp)}
            </span>
            {!isEditing && (
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setDraft(message.content)
                    setIsEditing(true)
                  }}
                  aria-label="Edit message"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopy}
                  aria-label="Copy message"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deleteMessage(message.id)}
                  aria-label="Delete message"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-6 group">
      {/* AI Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
        <Bot className="h-4 w-4 text-accent-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Polymind</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Thinking State */}
        {message.isThinking && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-ring animate-pulse-dots" />
                <div className="w-2 h-2 rounded-full bg-ring animate-pulse-dots-delay-1" />
                <div className="w-2 h-2 rounded-full bg-ring animate-pulse-dots-delay-2" />
              </div>
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
            {message.thinkingContent && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 transition-colors"
                onClick={() => setShowThinking(!showThinking)}
              >
                <ChevronDown
                  className={cn('h-3 w-3 transition-transform', showThinking && 'rotate-180')}
                />
                View reasoning
              </button>
            )}
            {showThinking && message.thinkingContent && (
              <div className="p-3 bg-muted rounded-lg text-muted-foreground mb-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {message.thinkingContent}
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Streaming cursor */}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-ring animate-blink ml-0.5 align-middle" />
        )}

        {/* Action buttons */}
        {!message.isThinking && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              aria-label="Copy response"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', message.reaction === 'up' && 'text-green-500')}
              onClick={() => toggleReaction(message.id, 'up')}
              aria-label="Good response"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', message.reaction === 'down' && 'text-destructive')}
              onClick={() => toggleReaction(message.id, 'down')}
              aria-label="Bad response"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
            {isLast && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => void regenerateResponse()}
                aria-label="Regenerate response"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => deleteMessage(message.id)}
              aria-label="Delete message"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
