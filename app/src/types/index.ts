export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isThinking?: boolean;
  thinkingContent?: string;
  attachments?: Attachment[];
  reaction?: 'up' | 'down';
  bookmarked?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
  file?: File;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  isPinned?: boolean;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  conversations: Conversation[];
}

export interface Artifact {
  id: string;
  name: string;
  type: 'code' | 'document' | 'image' | 'file';
  language?: string;
  size?: string;
  preview?: string;
}

export interface ProgressStep {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'success' | 'error';
  timestamp: Date;
  logs?: string[];
}

export interface ActivityItem {
  id: string;
  description: string;
  timestamp: Date;
  icon: string;
}

export interface Workspace {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface Template {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export type Theme = 'light' | 'dark' | 'system';
export type PanelTab = 'artifacts' | 'progress' | 'activity';
export type SettingsTab = 'account' | 'workspace' | 'appearance' | 'models' | 'integrations' | 'billing' | 'notifications' | 'security' | 'shortcuts';

export interface NotificationPrefs {
  newMessages: boolean;
  mentions: boolean;
  taskCompletions: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
}

export interface Preferences {
  reducedMotion: boolean;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  notifications: NotificationPrefs;
}
