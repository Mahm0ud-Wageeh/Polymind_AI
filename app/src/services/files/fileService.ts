import { api } from '@/lib/api'

export interface UploadedFile {
  id: string
  name: string
  mime_type: string | null
  size: number
  conversation_id: string | null
  created_at: string
  url: string | null
}

export const fileService = {
  async upload(file: File, workspaceId: string, conversationId?: string): Promise<UploadedFile> {
    const body = new FormData()
    body.append('file', file)
    body.append('workspace_id', workspaceId)
    if (conversationId) body.append('conversation_id', conversationId)
    return api.postForm<UploadedFile>('/files', body)
  },
}
