import { describe, it, expect } from 'vitest'
import { cn, generateId, formatRelativeTime, formatTime } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('lets later tailwind classes win over conflicting earlier ones', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('returns unique values across many calls', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()))
    expect(ids.size).toBe(200)
  })
})

describe('formatRelativeTime', () => {
  it('returns "Just now" for the current time', () => {
    expect(formatRelativeTime(new Date())).toBe('Just now')
  })

  it('formats minutes', () => {
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60_000))).toBe('5m ago')
  })

  it('formats hours', () => {
    expect(formatRelativeTime(new Date(Date.now() - 3 * 3_600_000))).toBe('3h ago')
  })

  it('formats days', () => {
    expect(formatRelativeTime(new Date(Date.now() - 2 * 86_400_000))).toBe('2d ago')
  })
})

describe('formatTime', () => {
  it('returns a HH:MM style string', () => {
    expect(formatTime(new Date('2026-01-01T13:30:00'))).toMatch(/\d{1,2}:\d{2}/)
  })
})
