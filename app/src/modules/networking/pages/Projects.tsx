import { useState, type FormEvent } from 'react'
import { FolderKanban, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useQueries'

export default function Projects() {
  const workspaceId = localStorage.getItem('polymind.workspace') ?? undefined
  const { data: projects = [], isLoading, error } = useProjects(workspaceId)
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!workspaceId || !name.trim()) return
    await createProject.mutateAsync({ workspaceId, name: name.trim(), description: description.trim() })
    setName('')
    setDescription('')
  }

  async function handleDelete(project: { id: string; name: string }) {
    if (!window.confirm(`Delete "${project.name}"? This does not delete its conversations.`)) return
    await deleteProject.mutateAsync(project.id)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">Organize network designs and conversations in real workspaces.</p>
          </div>
          <FolderKanban className="mt-1 h-7 w-7 text-muted-foreground" />
        </div>

        <form onSubmit={handleSubmit} className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" maxLength={255} required />
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" className="min-h-9" />
          <Button type="submit" disabled={createProject.isPending || !workspaceId}>
            {createProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Create project</>}
          </Button>
        </form>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error.message}</div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Create your first project to organize your network work.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <article key={project.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium">{project.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{project.description || 'No description'}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${project.name}`} onClick={() => void handleDelete(project)} disabled={deleteProject.isPending}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
