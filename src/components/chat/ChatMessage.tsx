import { useState } from 'react'
import type { Message } from '@/types'
import { cn, formatTime } from '@/lib/utils'
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ChevronDown,
  Bot,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
  message: Message
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
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-border">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1E1E1E] text-gray-400 text-xs">
          <span>{match ? match[1] : 'code'}</span>
          <button
            type="button"
            className="hover:text-white transition-colors"
            onClick={() => navigator.clipboard.writeText(String(children))}
            aria-label="Copy code"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <pre className="p-4 bg-[#1E1E1E] overflow-x-auto">
          <code className="text-sm font-mono text-gray-300">{children}</code>
        </pre>
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

export function ChatMessage({ message }: ChatMessageProps) {
  const [showThinking, setShowThinking] = useState(false)
  const [, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[70%] flex flex-col items-end gap-1">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
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
          <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm">
            <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-xs text-muted-foreground px-1">
            {formatTime(message.timestamp)}
          </span>
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
          <span className="text-xs font-medium text-muted-foreground">NetTopo</span>
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
              <div className="p-3 bg-muted rounded-lg text-muted-foreground mb-3 font-mono text-xs leading-relaxed">
                {message.thinkingContent}
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
