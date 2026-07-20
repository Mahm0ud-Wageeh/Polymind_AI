# Changelog

All notable changes to Polymind are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) until v1.0.0.

---

## [Unreleased] — `refactor/polymind-hardening`

### Added

- **Lab Emulator** (`/tools/lab-emulator`): full Containerlab lifecycle management. `LabOrchestrator` service detects a real containerlab daemon or falls back to simulation. Start/stop/refresh per lab, node status cards, YAML topology viewer. Backed by a new `labs` DB table, `Lab` model, and REST API (`/api/v1/labs/*`). (Phase 5)
- **TanStack React Query**: `@tanstack/react-query` installed with smart retry config. Typed query hooks (`useQueries.ts`) for dashboard, projects, designs, agents, and library. `Dashboard`, `Projects`, and `Agents` pages migrated from manual `useEffect`/`fetch` to query-based data fetching. (Phase 2)
- **CSP header**: `Content-Security-Policy` with `default-src 'self'`, `frame-ancestors 'none'`, and restricted script/style sources. `Cross-Origin-Resource-Policy: same-origin` also added. (Phase 6)
- **Per-endpoint rate limiters**: `tools` (20 req/min) and `chat` (30 req/min) rate limiters registered in `AppServiceProvider` and applied to routes in `api.php`. Tighter than the general 120 req/min API limit. (Phase 6)
- **Per-agent model overrides**: each of the 16 engineering agents now specifies a concrete model (`gpt-4o` or `llama-3.3-70b-versatile`) instead of relying solely on the global default. (Phase 4)
- **New agents**: `Packet Analyzer`, `Wireless Engineer`, `Cloud Networking Engineer`, and `Infrastructure Consultant` added to the seed roster (16 total). (Phase 4)

### Changed

- **Default AI provider**: changed from `openai`/`gpt-4o-mini` to `groq`/`llama-3.3-70b-versatile` (free tier). Fallbacks reordered to `openai` → `openrouter`. (Phase 4)
- **Agent seeding consolidated**: removed duplicate `DatabaseSeeder::seedAgents()` (11 agents via `firstOrCreate`). All 16 agents now live in `EngineeringAgentsSeeder` (12 original + 4 new, all via `updateOrCreate`). (Phase 4)
- **`SecurityHeaders` middleware**: now sets CSP, `Cross-Origin-Resource-Policy`, and conditionally adds HSTS (production + HTTPS). (Phase 6)
- **`SettingsTab` type**: union type in `types/index.ts` now includes all 9 tab IDs (`'notifications'`, `'security'`, `'shortcuts'`). (Phase 1)

### Fixed

- **TypeScript type safety**: `settingsTab` in Zustand store typed as `SettingsTab` (was `string`). `generateId()` uses `crypto.randomUUID()` instead of `Math.random()`. (Phase 1)
- **Ghost files removed**: `.tmp/polymind-proposal/build_proposal.py`, `app/info.md`, `backend/exit`, `backend/supervisord.pid`. Binary `deliverables/` removed from git tracking. (Phase 1)
- **`|| true` anti-pattern removed** from CI pipeline for `phpstan analyse` and `pint --test` steps. (Phase 1)
- **Vite config cleaned**: `kimi-plugin-inspect-react` import and dependency removed. (Phase 1)

### Removed

- `deliverables/` directory from git tracking.
- `kimi-plugin-inspect-react`, `diff`, and `@types/diff` npm packages (101 packages uninstalled).
- Empty directories `app/src/data/` and `app/src/modules/components/`.

---

## [0.2.0] — Pre-refactor

- Chat with SSE streaming and multi-provider AI backend (OpenAI, Anthropic, Gemini, Groq, OpenRouter, DeepSeek, Mistral, Ollama).
- 12 engineering AI agents with domain-specific system prompts.
- Network design generator, IP planner, config diff, network validator, AI troubleshooter, Cisco CLI generator, topology designer (Cytoscape.js).
- Billing with Stripe (subscription plans, checkout, customer portal).
- Multi-tenancy via workspace/organization provisioning.
- 13 modules in the navigation registry, all backed by real API endpoints.
