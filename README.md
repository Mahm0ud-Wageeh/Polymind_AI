# Polymind — AI Network Engineering Workspace

A production-ready, full-stack **AI platform built for Network Engineers** — design,
automate, document, analyze, troubleshoot, and manage IT infrastructure with AI.
Version 1 focuses on Network Engineering, with an extensible module architecture
prepared for future engineering domains (Cloud, DevOps, Cybersecurity, and more)
without rewrites.

Built on a polished React frontend and a Laravel 12 API with multi-provider AI,
streaming chat, RBAC, usage metering, billing, an agents/templates library, and a
tools/MCP registry.

> Demo login: **demo@polymind.ai** / **password**

---

## ✨ Features

- **Streaming chat** over Server-Sent Events with multi-provider AI (OpenAI, Anthropic,
  Gemini, Groq, OpenRouter, DeepSeek, Mistral, Ollama) and automatic fallbacks.
- **Rich messages** — Markdown, syntax highlighting, LaTeX, Mermaid diagrams,
  file uploads, edit / delete / regenerate / reactions.
- **Workspaces, projects & conversations** with a fast, keyboard-friendly shell
  (command palette, collapsible sidebar, right panel for artifacts/activity).
- **Library (marketplace)** — discover public agents, prompt templates, and
  built-in tools / MCP servers.
- **Billing** — Stripe Checkout & Billing Portal, plans (Free / Pro / Team),
  month-to-date usage metering, and invoices.
- **Auth & RBAC** — Sanctum token auth, OAuth (Google/GitHub), roles & permissions
  (Spatie), email verification.
- **Production hardening** — security headers, CORS, Redis cache/queue/session,
  rate limiting, code-splitting, and a test suite (Vitest + Playwright + PHPUnit).

---

## 🧱 Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Radix UI |
| Backend    | Laravel 12, PHP 8.3 |
| Database   | PostgreSQL |
| Cache/Queue| Redis |
| Auth       | Laravel Sanctum, Socialite, Spatie Permission |
| Billing    | Stripe |
| Testing    | Vitest, Testing Library, Playwright, PHPUnit |
| DevOps     | Docker Compose, GitHub Actions CI |

---

## 📂 Project structure

```
.
├── app/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/   # UI, shell, chat, panels, command palette
│   │   ├── modules/      # domain modules + the module registry (extensible)
│   │   │   ├── registry.ts
│   │   │   ├── components/  # ModuleComingSoon, shared module UI
│   │   │   └── networking/  # Networking v1 modules: pages + services
│   │   ├── pages/        # Auth, Onboarding, Settings
│   │   ├── services/     # api clients: auth, chat, billing, library, networking
│   │   ├── store/        # Zustand store (UI state; routing is via React Router)
│   │   └── lib/          # api wrapper, utils, design tokens
│   └── e2e/              # Playwright specs
├── backend/             # Laravel 12 API
│   ├── app/Http/Controllers/Api/V1/
│   ├── app/Services/     # AI, Billing, Tenancy, Networking
│   ├── config/           # ai.php, billing.php, tools.php, services.php
│   ├── database/         # migrations + seeders
│   └── tests/            # Feature + Unit
├── docs/                # SECURITY.md, TESTING.md
└── docker-compose.yml
```

---

## 🚀 Getting started (Docker)

**Prerequisites:** Docker Desktop.

```bash
# 1. Copy env files
cp backend/.env.example backend/.env

# 2. Build & start everything (frontend, api, postgres, redis)
docker compose up -d --build

# 3. Generate the app key, migrate & seed
docker compose exec api php artisan key:generate
docker compose exec api php artisan migrate --seed
```

- Frontend: http://localhost:5173
- API: http://localhost:8000/api/v1

To enable **real AI responses**, add a provider key (e.g. `OPENAI_API_KEY`) to
`backend/.env`, then run `docker compose exec api php artisan config:clear`.

---

## 🔑 Key environment variables (`backend/.env`)

| Variable | Purpose |
| -------- | ------- |
| `OPENAI_API_KEY` (or other provider) | Enables live AI responses |
| `AI_DEFAULT_PROVIDER` / `AI_DEFAULT_MODEL` | Default model routing |
| `STRIPE_SECRET` / `STRIPE_WEBHOOK_SECRET` | Enables live billing |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_TEAM` | Stripe recurring price ids |
| `MCP_GITHUB_URL` / `MCP_SLACK_URL` | Optional MCP tool servers |
| `FRONTEND_URL` | Used for CORS & billing redirects |

---

## 🧪 Testing

```bash
# Frontend unit tests
docker compose exec frontend npm run test

# Frontend E2E (or run in CI)
docker compose exec frontend npm run test:e2e

# Backend tests
docker compose exec api php artisan test
```

See `docs/TESTING.md` and `docs/SECURITY.md` for details.

---

## 📡 API overview (`/api/v1`)

| Group | Endpoints |
| ----- | --------- |
| Auth | `register`, `login`, `logout`, `me`, OAuth, password reset |
| Chat | `chat/stream` (SSE), `chat/completions` |
| Content | `workspaces`, `projects`, `conversations`, `conversations.messages`, `files` |
| Library | `agents`, `templates`, `tools` |
| Insights | `providers`, `dashboard` |
| Billing | `billing`, `billing/plans`, `billing/checkout`, `billing/portal`, `billing/webhook` |

All routes except auth and the Stripe webhook require a Sanctum bearer token.

---

## 📄 License

Built as a graduation project. All rights reserved by the author.
