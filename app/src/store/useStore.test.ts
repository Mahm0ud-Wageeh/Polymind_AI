import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './useStore'

describe('useStore preferences + profile', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exposes sensible default preferences', () => {
    const { preferences } = useStore.getState()
    expect(preferences.defaultModel).toBe('GPT-4o')
    expect(preferences.temperature).toBe(0.7)
    expect(preferences.reducedMotion).toBe(false)
    expect(preferences.notifications.newMessages).toBe(true)
  })

  it('updatePreferences persists and merges notifications', () => {
    useStore.getState().updatePreferences({ temperature: 0.2 })
    useStore.getState().updatePreferences({
      notifications: {
        ...useStore.getState().preferences.notifications,
        mentions: false,
      },
    })

    const { preferences } = useStore.getState()
    expect(preferences.temperature).toBe(0.2)
    expect(preferences.notifications.mentions).toBe(false)
    // Untouched keys are preserved.
    expect(preferences.notifications.newMessages).toBe(true)

    const stored = JSON.parse(localStorage.getItem('polymind:preferences') as string)
    expect(stored.temperature).toBe(0.2)
    expect(stored.notifications.mentions).toBe(false)
  })

  it('updateWorkspace renames the current workspace', () => {
    useStore.getState().updateWorkspace({ name: 'Renamed Workspace' })
    expect(useStore.getState().currentWorkspace.name).toBe('Renamed Workspace')
  })

  it('updateUserProfile patches the signed-in user', () => {
    useStore.getState().setUser({
      id: 'user-1',
      name: 'Original Name',
      email: 'user@example.com',
      role: 'member',
    })
    useStore.getState().updateUserProfile({ name: 'New Name' })
    expect(useStore.getState().user?.name).toBe('New Name')
  })

  it('setTheme persists the choice and toggles the dark class', () => {
    useStore.getState().setTheme('dark')
    expect(localStorage.getItem('polymind:theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    useStore.getState().setTheme('light')
    expect(localStorage.getItem('polymind:theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
