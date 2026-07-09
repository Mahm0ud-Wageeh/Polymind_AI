# Polymind Design System

A single source of truth for the visual language. The system is token-driven:
every color, radius, shadow, typography step, motion curve and z-index layer is
defined once and consumed everywhere via Tailwind utilities or CSS variables.

- **CSS variables** live in `src/index.css` (`:root` for light, `.dark` for dark).
- **Tailwind theme** maps those variables to utility classes in `tailwind.config.js`.
- **TypeScript tokens** for JS-only needs live in `src/lib/design-tokens.ts`.

---

## 1. Color tokens

All colors are stored as HSL channels in CSS variables and exposed through
Tailwind as `bg-*`, `text-*`, `border-*`, `ring-*`. Every token has a light and
a dark value, so components never hard-code a color.

| Token | Tailwind class | Purpose |
| --- | --- | --- |
| `background` / `foreground` | `bg-background` `text-foreground` | App surface + base text |
| `card` / `card-foreground` | `bg-card` | Cards, panels, popovers surfaces |
| `popover` / `popover-foreground` | `bg-popover` | Floating surfaces |
| `primary` / `primary-foreground` | `bg-primary` | Primary actions |
| `secondary` / `secondary-foreground` | `bg-secondary` | Secondary surfaces |
| `muted` / `muted-foreground` | `bg-muted` `text-muted-foreground` | Subtle backgrounds + secondary text |
| `accent` / `accent-foreground` | `bg-accent` | Highlights, active nav |
| `destructive` | `bg-destructive` | Errors, destructive actions |
| `success` | `bg-success` | Success / positive states |
| `warning` | `bg-warning` | Warnings |
| `info` | `bg-info` | Informational states |
| `border` / `input` | `border-border` | Borders + field outlines |
| `ring` | `ring-ring` | Focus rings |
| `sidebar-*` | `bg-sidebar` ... | Sidebar-specific surface set |

> `success`, `warning` and `info` are now variable-driven, so they adapt
> correctly in dark mode instead of using a single hard-coded value.

---

## 2. Typography

Font family: **Inter** (`font-sans`), monospace stack via `font-mono`.

Type scale (Tailwind `text-*`) ships tuned line-heights, and large steps add
negative letter-spacing for a tighter, premium headline feel:

| Class | Size | Line height | Tracking |
| --- | --- | --- | --- |
| `text-2xs` | 0.6875rem | 1rem | - |
| `text-xs` | 0.75rem | 1rem | - |
| `text-sm` | 0.875rem | 1.25rem | - |
| `text-base` | 1rem | 1.5rem | - |
| `text-lg` | 1.125rem | 1.75rem | - |
| `text-xl` | 1.25rem | 1.75rem | - |
| `text-2xl` | 1.5rem | 2rem | -0.01em |
| `text-3xl` | 1.875rem | 2.25rem | -0.02em |
| `text-4xl` | 2.25rem | 2.5rem | -0.02em |
| `text-5xl` | 3rem | 1.1 | -0.02em |

---

## 3. Spacing & layout

Uses the default Tailwind 4px spacing scale (`p-2` = 8px, `gap-4` = 16px, ...)
for consistency across the app. Prefer scale steps over arbitrary values.

---

## 4. Radius (elevation of corners)

Driven by a single `--radius` variable (0.625rem):

| Class | Value |
| --- | --- |
| `rounded-xs` | `--radius - 6px` |
| `rounded-sm` | `--radius - 4px` |
| `rounded-md` | `--radius - 2px` |
| `rounded-lg` | `--radius` |
| `rounded-xl` | `--radius + 4px` |

---

## 5. Elevation (shadows)

| Class | Use |
| --- | --- |
| `shadow-xs` | Hairline lift (inputs, chips) |
| `shadow-sm` | Resting cards |
| `shadow-md` | Raised cards, dropdowns |
| `shadow-lg` | Modals, popovers |
| `shadow-composer` | Chat composer top shadow |

---

## 6. Motion tokens

Durations (`transition-*`): `120`, `180`, `200`, `250`, `300`, `400` (ms).

Easing (`ease-*`):

| Class | Curve | Use |
| --- | --- | --- |
| `ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Entrances / emphasis |
| `ease-bounce-soft` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful pop |

Animations (`animate-*`): `fade-in`, `fade-out`, `slide-in-bottom`,
`slide-in-top`, `scale-in`, plus existing `pulse-dots`, `blink`, `shimmer`,
`accordion-down/up`.

For Framer Motion, import presets from `src/lib/design-tokens.ts`
(`transitions.fade`, `transitions.slideUp`, `transitions.pop`).

All motion is disabled automatically under `prefers-reduced-motion`.

---

## 7. Z-index layers

`z-dropdown` (1000) -> `z-sticky` (1100) -> `z-overlay` (1200) ->
`z-modal` (1300) -> `z-popover` (1400) -> `z-toast` (1500) -> `z-tooltip` (1600).

Mirrored in TS as `zLayer` in `src/lib/design-tokens.ts`.

---

## 8. Dark mode

Toggled by adding the `dark` class on `<html>` (class strategy). Every token
has a dark counterpart, so switching themes never requires per-component work.

---

## 9. Reusable components

Primitive UI components (Button, Card, Input, Select, Dialog, Tabs, Badge,
Avatar, Alert, Toast/Sonner, Tooltip, Progress, Table, Chart, Skeleton, ...)
live in `src/components/ui/` and are all built on these tokens. Compose feature
UI from those primitives rather than restyling from scratch.
