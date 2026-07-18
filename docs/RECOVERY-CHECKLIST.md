# Production Recovery Checklist

Audit date: 2026-07-12

This is an evidence-based recovery plan for the current repository. It is not a
feature roadmap: every item below is required to make existing UI and API
claims real.

## Critical blockers

- [ ] **Revoke exposed provider credentials.** The ignored local backend
  environment file contains live-looking AI provider keys. Rotate them at each
  provider, replace the local values, and keep `.env` ignored. Never put them
  in source control, logs, screenshots, or test fixtures.
- [ ] **Make the local stack runnable.** This workstation has neither PHP on
  `PATH` nor a running Docker Desktop daemon, so Laravel routes, migrations,
  tests, Pint, database queries, queues, Redis, and end-to-end API flows could
  not be executed or verified.
- [ ] **Stop all mock execution paths.** `src/store/useStore.ts`,
  `src/services/chat/chatService.ts`, and
  `src/services/networking/designerService.ts` manufacture conversations,
  messages, AI responses, dashboard inputs, projects, and designs. The
  runtime selector also silently chooses mocks when an API URL is missing.

## Frontend recovery

- [ ] Replace the Zustand store's seeded mock state and local-only mutations
  with API-backed loading, creation, update, deletion, retry, and error state
  for users, workspaces, projects, conversations, messages, artifacts, and
  activity.
- [ ] Implement an authenticated bootstrap and protected routing. The current
  app does not restore a session with `/auth/me`, does not redirect unauthenticated
  users, and displays an authenticated shell backed by mock data.
- [ ] Replace the login timeout in `pages/Auth.tsx` with real login,
  registration, password reset, OAuth callback handling, loading/error states,
  and logout.
- [ ] Connect onboarding to the workspace API. It currently changes only
  local UI preferences and does not create or update a workspace.
- [ ] Make chat persistence correct. The frontend's generated IDs do not match
  backend IDs; it does not load server conversations/messages; edit, delete,
  reaction, regeneration, attachment, and agent actions are local-only. It
  also does not render streaming deltas as they arrive.
- [ ] Implement multipart uploads before sending chat attachments, then use
  server records/URLs for previews and downloads. The composer currently only
  creates browser object URLs.
- [ ] Add real dashboard fetching and rendering. `Dashboard.tsx` deliberately
  renders em-dash placeholder metrics despite a `/dashboard` endpoint.
- [ ] Implement the existing Projects page against project CRUD, including
  create, edit, delete, project filtering, and empty/error states.
- [ ] Repair Network Designer request/response mapping. The backend requires
  `workspace_id`, but the frontend never sends it; the API returns snake_case
  resource fields while the UI expects camelCase fields. Result history,
  deletion, and “send to chat” are not connected.
- [ ] Remove or implement every navigable placeholder route: Topology,
  Configuration Generator, Documentation, Network Analyzer, Calculators, and
  Knowledge Base. Until real endpoints and data models exist, these routes and
  their navigation/quick links must not claim to provide functionality.
- [ ] Make Library failures visible and actionable instead of swallowing every
  failed request into empty arrays. Agent/template actions must select and
  persist the intended agent/template in a conversation, not merely navigate.
- [ ] Connect Settings account/workspace/model/integration/notification forms
  to real endpoints or remove controls that have no persistent backend
  contract. Billing is the only settings area currently issuing API calls.
- [ ] Replace the fake microphone and inactive prompt-enhancement controls
  with supported, tested functionality or remove them.
- [ ] Fix the 21 current ESLint errors and two warnings before CI can pass.
  The failures include invalid hooks (`Library.tsx`), render impurity,
  synchronous state updates in effects, and fast-refresh violations.
- [ ] Correct the stale E2E expectation (`Message Polymind`) and add browser
  coverage for authentication, protected routes, chat streaming, file upload,
  designer generation, CRUD actions, and console errors.

## Backend recovery

- [ ] Add authorization for every route-model binding. Project show/update/
  delete are entirely unscoped; template show/update/delete are unscoped; agent
  show is unscoped; workspace/project/conversation creation accepts foreign
  workspace/project IDs without validating membership. Use policies or a
  shared scoped lookup approach.
- [ ] Validate cross-resource ownership for conversations, messages, files,
  agents, templates, network designs, and projects. A valid UUID alone must
  not authorize access.
- [ ] Enforce plan limits and provider/model availability before AI generation.
  Billing calculates usage but does not prevent excess usage.
- [ ] Validate and persist file-to-message linkage, enforce media/type policy,
  serve private downloads through authorized endpoints or signed URLs, and
  virus-scan/quarantine uploads before making them available.
- [ ] Finish authentication flows: email verification is an unauthenticated
  timestamp mutation rather than a signed verification flow; OAuth has no
  frontend callback consumer; password reset response status is not checked;
  token/session expiry and multi-device revocation need defined behavior.
- [ ] Make AI provider configuration safe and verifiable: provider errors
  should become structured API errors; streaming must persist partial-failure
  state and avoid duplicate user messages on retries; provider credentials in
  the database are not selected by `AiManager`.
- [ ] Implement server-side support for the existing UI actions (message edit,
  reactions, artifacts, user/profile settings, notification preferences,
  workspace current-selection, provider settings). Their models or screens
  exist, but routes/controllers do not.
- [ ] Add controller/feature tests for every protected endpoint, ownership
  boundary, validation branch, upload/download, Stripe signature handling, AI
  failure/retry, SSE event sequence, and dashboard aggregation.
- [ ] Enable Pint and Larastan as blocking CI checks. The workflow currently
  hides both failures with `|| true`.

## Database and integration recovery

- [ ] Run migrations against PostgreSQL and SQLite test configuration; confirm
  UUID foreign keys, soft deletes, uniqueness, and cascade/null semantics.
- [ ] Add missing constraints/relations where contracts are implied: messages
  and network designs have UUID references without all corresponding foreign
  keys; current workspace has no database foreign key; artifact ownership
  resolution is incomplete.
- [ ] Seed only demonstrative public library records, never user-facing mock
  conversations/projects/data. Confirm the demo account is created only in
  local/development environments.
- [ ] Start and verify PostgreSQL, Redis, queue worker, filesystem storage, and
  CORS with the actual frontend origin (`5173`; the backend environment
  defaults still mention `3000`).
- [ ] Verify Stripe using test keys and signed webhook fixtures before enabling
  checkout/portal in production.

## Verification gate

- [ ] `npm run lint`, `npm run test`, `npm run build`, and targeted Playwright
  suites pass with no browser console errors.
- [ ] `php artisan route:list`, `php artisan migrate:fresh --seed`, `php artisan
  test`, Pint, and Larastan pass in a reproducible container/CI environment.
- [ ] Exercise registration, login, logout, refresh/reload, protected route,
  workspace/project CRUD, file upload/download/delete, chat stream/retry,
  network generation, dashboard, library, settings, and billing (test mode)
  against a running backend.
