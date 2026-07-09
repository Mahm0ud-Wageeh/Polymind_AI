# Phase 5 — Frontend Refactor (Increment 1)

This increment establishes the clean-architecture foundation without changing
the visual identity or any UI behavior. No component was redesigned.

## What changed

### 1. Separation of data from the store
- Extracted all mock data out of `src/store/useStore.ts` into `src/data/mockData.ts`.
- The store now imports the mock data instead of embedding it. This is the seam
  that Phase 6/7 will replace with real API data.

### 2. Chat service abstraction (`src/services/chat/chatService.ts`)
- Introduced a `ChatService` interface with a `mockChatService` implementation.
- All fake-AI logic (thinking message + delayed reply) now lives behind this
  interface. Phase 9/10 can drop in a real streaming HTTP implementation in one
  place, with zero UI changes.

### 3. Single source of truth for sending messages
- Added `sendMessage`, `appendMessage`, and `setMessages` actions to the store.
- `Composer` and `EmptyState` previously duplicated conversation-creation and
  fake-AI code (with inline `Math.random()` IDs and nested `setTimeout`s). They
  now both call `store.sendMessage()`. ID generation is unified via `generateId`.

### 4. Code splitting, Suspense and Error Boundary (`src/App.tsx`)
- Top-level pages (`AppShell`, `Auth`, `Onboarding`, `Settings`) are now loaded
  with `React.lazy` + `<Suspense>`, shrinking the initial bundle.
- Added `src/shared/components/ErrorBoundary.tsx` wrapping the whole app so a
  render error shows a friendly fallback instead of a blank screen.
- Added `src/shared/components/PageLoader.tsx` as the Suspense fallback.
- `App` now reads `currentPage` via a selector instead of destructuring the
  whole store, avoiding unnecessary re-renders. Theme is initialized on mount.

### 5. Strict TypeScript — zero `any`
- `src/components/chat/ChatMessage.tsx` used 14 `any`-typed Markdown renderers.
  They are now a single strongly-typed `Components` object from `react-markdown`.
- Verified: `grep -rn ': any' src` returns nothing.

### 6. Removed anti-patterns and dead code
- Removed `useStore.getState()` calls made during render in `Sidebar`, `TopBar`,
  and `CommandPalette` (replaced with proper store subscriptions / a
  `toggleCommandPalette` action).
- Deleted dead Vite boilerplate: `src/pages/Home.tsx` and `src/App.css`.

## Verification done in this increment
- Offline syntax check (esbuild transform) passed for every changed file.
- `grep` confirms: no `: any`, no `useStore.getState()` in `src`, dead files gone.

## To verify locally (recommended before pushing)
```bash
npm install
npm run build   # runs tsc -b + vite build
npm run dev     # smoke-test the UI
```

## Not in this increment (tracked for next Phase 5 passes)
- Full feature-folder migration of every component (kept `@/components/ui` and
  `@/types` in place to avoid churn / risk this pass).
- React Router route objects (still switch-based navigation via `currentPage`).
- Strengthening `settingsTab` from `string` to the `SettingsTab` union.
- TanStack Query + a typed HTTP API layer (arrives with the Phase 6 backend).
