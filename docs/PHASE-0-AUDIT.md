# Phase 0 Audit — 2026-07-20

This report was produced before implementation changes. It traces the delivered
modules from their route entry points to their current data boundary.

## Module trace and decision

| Module | Frontend path and boundary | API / backend boundary | Data boundary | Decision |
| --- | --- | --- | --- | --- |
| Dashboard | `app/src/modules/networking/pages/Dashboard.tsx` → `services/dashboard/dashboardService.ts` | `GET /api/v1/dashboard` → `DashboardController` | `UsageRecord`, `Project`, `Conversation`, `NetworkDesign` | KEEP |
| Projects | `pages/Projects.tsx` → `services/projects/projectService.ts` | `/api/v1/projects` → `ProjectController` | `Project` → `projects` | KEEP |
| Network Designer | `pages/Designer.tsx` → `services/networking/designerService.ts` | `/api/v1/network-designs` and `/generate` → `NetworkDesignController` → AI services | `NetworkDesign` → `network_designs` | KEEP |
| Topology Designer | `pages/TopologyDesigner.tsx` → `components/topology/TopologyEditor.tsx` | None; graph is browser-only | Browser state only | FIX: add save/load under network designs before claiming persistence |
| AI Chat | `pages/Workspace.tsx` → `store/useStore.ts` → `services/chat/chatService.ts` | `POST /api/v1/chat/stream` → `ChatController` → `AiManager` | `Conversation` / `Message` → `conversations` / `messages` | KEEP |
| Cisco CLI | `pages/CiscoCliGenerator.tsx` → `services/networking/ciscoCliService.ts` | `POST /api/v1/tools/cisco-cli/generate` → `CiscoCliController` | AI response only; no persisted artifact | KEEP; persistence is optional to current tool contract |
| IP Planner | `pages/IpPlanner.tsx` → `lib/ipUtils.ts` | None | Browser state only | COMPLETE: add validated API service + tests; keep deterministic calculations server-side |
| Network Validator | `pages/NetworkValidator.tsx` → `lib/validationEngine.ts` | None | Browser state only | COMPLETE: add validated API service + tests; share a typed validation report contract |
| Config Diff | `pages/ConfigDiff.tsx` → `diff` package | None | Browser state only | COMPLETE: add validated API service + tests; return a stable diff contract |
| AI Troubleshooter | `pages/Troubleshooter.tsx` → `services/networking/troubleshootService.ts` | `POST /api/v1/tools/troubleshoot/analyze` → `TroubleshootController` | AI response only | KEEP |
| Library | `pages/Library.tsx` → `services/library/libraryService.ts` | `/agents`, `/templates`, `/tools` → respective controllers/config | `Agent`, `Template`, configured tools | KEEP |
| AI Agents | `pages/Agents.tsx` → `store/useStore.ts` → `services/agents/agentsService.ts` | `/api/v1/agents` → `AgentController` | `Agent` → `agents` | FIX: seed has useful prompts, but all public presets bind `tools: []` and chat does not select an agent |
| Documentation | `pages/NetworkDocumentation.tsx` → `designerService` + local `documentationService.ts` | Reads designs only; no documentation-generation endpoint | Browser-generated Markdown/BOM download | COMPLETE: add a protected documentation endpoint/service and persist the generated output or associated artifact |

The four requested incomplete modules are worth completing for graduation scope;
they are not candidates for removal. Estimated implementation effort: IP planner
and config diff are small deterministic services; validator and documentation are
medium because they need a durable report/document contract and tests.

## Persistence verification

`backend/app/Http/Controllers/Api/V1/ChatController.php:77-90` persists the
assistant message inside the stream callback after `AiManager::chat()` returns,
records usage, and updates `conversations.last_message_at`. The non-streamed path
does the equivalent at lines 108-121. Reload is supported through
`ConversationController` and the store's `GET /conversations/{id}` call.

Gap: if the provider throws while streaming, no assistant error record is stored
and the user message remains. This should be handled as a failed completion, not
treated as successful persistence.

## KEEP / FIX / CUT evidence

| Status | Evidence | Action |
| --- | --- | --- |
| FIX | `app/src/store/useStore.ts:133-263` retains `mockConversations` and `mockProjects`, then voids them | Remove after confirming no imports/references outside this file (confirmed by `rg`) |
| FIX | `app/info.md` references removed layout/App.css paths | Delete stale document |
| FIX | repository contains `.tmp/`, `backend/exit`, `backend/supervisord.pid`; `.gitignore` lacks `.tmp/` and `*.pid` | Delete runtime/temp artifacts and ignore future copies |
| FIX | `app/package.json` names the package `my-app` | Rename to `polymind` |
| FIX | `backend/config/sanctum.php` and `backend/config/session.php` are absent; `.env.example` defaults to paid OpenAI | Publish/configure stateful SPA auth settings and use Groq/free fallbacks in the example environment |
| FIX | no `labs`, `lab_nodes`, `lab_configs`, `LabOrchestrator`, Containerlab, PTY, or xterm references found by `rg` | Real emulation is unimplemented; requires an infrastructure-capable later phase |
| FIX | `database/seeders/EngineeringAgentsSeeder.php` has prompts but assigns `tools: []`; `ChatController` has no agent binding input | Add tool bindings and agent selection through the existing chat contract |
| CUT | None beyond the proven junk listed above | Do not remove unproven source, routes, migrations, dependencies, or UI components |

## Static-analysis and test audit status

The frontend currently has neither `knip`, `ts-prune`, nor `depcheck` in
`app/node_modules/.bin`; the backend has no `vendor/` directory, so `artisan`,
PHPUnit, Pint, and Larastan cannot run in this workspace. `php` is also not on
the current PATH. The PowerShell execution policy blocks `npm.ps1`; use
`npm.cmd` for frontend commands. These are environment blockers, not evidence
that source candidates are unused. Dependency and UI-component pruning remains
deferred until the required audit tooling and backend dependencies are available.

## Architecture findings

The API client already exists at `app/src/lib/api.ts`, but it is a single file
rather than the requested `src/lib/api/` seam. The frontend currently has no
TanStack Query dependency. Backend controllers contain validation and service
logic directly in several places; Form Requests, consistent error resources, and
queued long-running work are not yet uniformly present.

