/**
 * Central design tokens for Polymind.
 *
 * These mirror the CSS custom properties in `src/index.css` and the Tailwind
 * theme in `tailwind.config.js`, giving a single typed source of truth for the
 * values that need to be referenced from TypeScript (for example Framer Motion
 * transitions, or anywhere a raw number/easing is required).
 *
 * Prefer Tailwind utility classes (`bg-primary`, `rounded-lg`, `shadow-md`,
 * `animate-fade-in`, ...) inside components. Reach for these constants only
 * when a value must live in JS.
 */

/** Motion durations in SECONDS (Framer Motion friendly). */
export const motionDuration = {
  fast: 0.12,
  base: 0.18,
  moderate: 0.25,
  slow: 0.3,
  slower: 0.4,
} as const

/** Cubic-bezier easing curves as control-point tuples. */
export const motionEasing = {
  smooth: [0.4, 0, 0.2, 1],
  emphasized: [0.2, 0, 0, 1],
  bounceSoft: [0.34, 1.56, 0.64, 1],
} as const

/** Ready-made Framer Motion transition presets. */
export const transitions = {
  fade: { duration: motionDuration.base, ease: motionEasing.smooth },
  slideUp: { duration: motionDuration.moderate, ease: motionEasing.emphasized },
  pop: { duration: motionDuration.base, ease: motionEasing.bounceSoft },
} as const

/** Z-index layering scale (matches Tailwind `z-*` named tokens). */
export const zLayer = {
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
} as const

/**
 * Semantic color tokens. Each is available both as a CSS variable
 * (`hsl(var(--<token>))`) and as Tailwind classes (`bg-<token>`,
 * `text-<token>`, `border-<token>`).
 */
export const colorTokens = [
  'background',
  'foreground',
  'card',
  'popover',
  'primary',
  'secondary',
  'muted',
  'accent',
  'destructive',
  'success',
  'warning',
  'info',
  'border',
  'input',
  'ring',
] as const

export type ColorToken = (typeof colorTokens)[number]

/** Border-radius scale (Tailwind `rounded-<key>`), derived from `--radius`. */
export const radiusScale = ['xs', 'sm', 'md', 'lg', 'xl'] as const
export type RadiusToken = (typeof radiusScale)[number]

/** Elevation / shadow scale (Tailwind `shadow-<key>`). */
export const elevationScale = ['xs', 'sm', 'md', 'lg'] as const
export type ElevationToken = (typeof elevationScale)[number]
