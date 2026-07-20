import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useStore } from '@/store/useStore'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  ChevronsUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { navModules, NAV_GROUP_LABELS, type NavGroup, type ModuleManifest } from '@/modules/registry'

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
    projects,
    currentWorkspace,
    workspaces,
    user,
    setCommandPaletteOpen,
  } = useStore()

  const navigate = useNavigate()
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }))
  }

  const todayConvs = conversations.filter(
    (c) => c.timestamp > new Date(Date.now() - 86400000)
  )
  const weekConvs = conversations.filter(
    (c) => c.timestamp <= new Date(Date.now() - 86400000) && c.timestamp > new Date(Date.now() - 86400000 * 7)
  )
  const pinnedConvs = conversations.filter((c) => c.isPinned)

  // Group modules by navGroup for the sidebar nav section.
  const grouped = navModules().reduce<Record<string, ModuleManifest[]>>((acc, mod) => {
    ; (acc[mod.navGroup] ??= []).push(mod)
    return acc
  }, {})
  const groupOrder: NavGroup[] = ['manage', 'create', 'system']

  if (sidebarCollapsed) {
    return (
      <TooltipProvider delayDuration={300}>
        <aside className="w-16 h-full border-r border-border bg-background flex flex-col items-center py-3 shrink-0 overflow-hidden">
          <div className="mb-4">
            <Logo size="sm" showText={false} />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full mb-2"
                onClick={createConversation}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full mb-2"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Search</TooltipContent>
          </Tooltip>

          <div className="flex-1 w-full flex flex-col items-center gap-1 pt-4 overflow-y-auto">
            {conversations.slice(0, 6).map((conv) => (
              <Tooltip key={conv.id}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                      activeConversationId === conv.id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    onClick={() => setActiveConversation(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{conv.title}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="mt-auto flex flex-col items-center gap-1 pt-4 border-t border-border w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/library')}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Library</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{user?.name}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleSidebar}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand</TooltipContent>
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>
    )
  }

  return (
    <aside className="w-[280px] h-full border-r border-border bg-background flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <Logo size="md" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
              <span className="truncate">{currentWorkspace.name}</span>
              <ChevronsUpDown className="h-3 w-3 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {workspaces.map((ws) => (
              <DropdownMenuItem key={ws.id}>
                <FolderOpen className="h-4 w-4 mr-2" />
                {ws.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          className="w-full justify-start gap-2 h-10"
          onClick={createConversation}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md hover:bg-muted transition-colors"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-xs bg-background border border-border rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation — modules from the registry */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3">
        {groupOrder.map((group) => {
          const items = grouped[group]
          if (!items || items.length === 0) return null
          return (
            <div key={group} className="mb-3">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {NAV_GROUP_LABELS[group]}
                </span>
              </div>
              {items.map((mod) => (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground border-l-2 border-ring'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <mod.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1 text-left">{mod.name}</span>
                </NavLink>
              ))}
            </div>
          )
        })}

        {/* Conversations header */}
        <div className="border-t border-border pt-2 mb-2">
          <div className="flex items-center gap-1 px-2 py-1.5">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conversations</span>
          </div>
        </div>

        {/* Today */}
        {todayConvs.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today</span>
            </div>
            {todayConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversation(conv.id)}
              />
            ))}
          </div>
        )}

        {/* Previous 7 Days */}
        {weekConvs.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Previous 7 Days</span>
            </div>
            {weekConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversation(conv.id)}
              />
            ))}
          </div>
        )}

        {/* Pinned */}
        {pinnedConvs.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <Pin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pinned</span>
            </div>
            {pinnedConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversation(conv.id)}
                showPin
              />
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <FolderOpen className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
            </div>
            {projects.map((project) => (
              <div key={project.id}>
                <button
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => toggleProject(project.id)}
                >
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 text-muted-foreground transition-transform',
                      !expandedProjects[project.id] && '-rotate-90'
                    )}
                  />
                  <span className="font-medium truncate">{project.name}</span>
                </button>
                {expandedProjects[project.id] && (
                  <div className="ml-4 border-l border-border">
                    {project.conversations.map((conv) => (
                      <button
                        key={conv.id}
                        className={cn(
                          'flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md transition-colors',
                          activeConversationId === conv.id
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        onClick={() => setActiveConversation(conv.id)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="truncate">{conv.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors mb-1"
          onClick={() => navigate('/library')}
        >
          <FolderOpen className="h-4 w-4" />
          Library
        </button>
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors mb-1"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function ConversationItem({
  conv,
  isActive,
  onClick,
  showPin,
}: {
  conv: { id: string; title: string; timestamp: Date }
  isActive: boolean
  onClick: () => void
  showPin?: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors group cursor-pointer',
        isActive
          ? 'bg-accent text-accent-foreground border-l-2 border-ring'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {showPin ? (
        <Pin className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate flex-1 text-left">{conv.title}</span>
      <button
        type="button"
        aria-label="Conversation options"
        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-background rounded transition-all"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <MoreHorizontal className="h-3 w-3" />
      </button>
    </div>
  )
}
