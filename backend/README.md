# Polymind API (Laravel 12)

Production-oriented REST + SSE API for the Polymind AI workspace.

## Stack

- PHP 8.3, Laravel 12
- PostgreSQL 16 (UUID primary keys everywhere)
- Redis (cache, queues, sessions)
- Laravel Sanctum (token auth) + Socialite (Google/GitHub OAuth)
- spatie/laravel-permission (RBAC)

## Architecture

```
app/
├─ Http/Controllers/Api/V1/   # Versioned REST controllers (auth, chat, conversations, ...)
├─ Http/Resources/            # API response transformers
├─ Models/                    # Eloquent models (UUIDs, soft deletes)
├─ Providers/AppServiceProvider.php   # AiManager binding + rate limiters
└─ Services/
   ├─ AI/                     # Provider-agnostic AI layer
   │  ├─ Contracts/AiProvider.php
   │  ├─ Data/                # ChatRequest / ChatResponse DTOs
   │  ├─ Providers/           # OpenAiCompatible / Anthropic / Gemini drivers
   │  ├─ Support/CostCalculator.php
   │  └─ AiManager.php        # resolution + retries + fallbacks
   └─ Tenancy/WorkspaceProvisioner.php
```

### AI abstraction

Every provider implements `AiProvider` (`chat`, `stream`, `key`, `models`). `AiManager` resolves the configured driver from `config/ai.php`, then retries and falls back across providers on failure. Adding a provider = one config entry (for OpenAI-compatible APIs, zero new code).

## Key endpoints (prefix `/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` | Token auth |
| GET  | `/auth/oauth/{provider}/redirect`, `/auth/oauth/{provider}/callback` | OAuth |
| POST | `/chat/stream` | Streamed (SSE) assistant reply |
| POST | `/chat/completions` | Blocking assistant reply |
| CRUD | `/conversations`, `/messages`, `/workspaces`, `/projects`, `/agents`, `/templates`, `/files` | Resources |
| GET  | `/providers` | Provider + model catalog |
| GET  | `/dashboard` | Usage & cost analytics |

Public auth routes are throttled (`throttle:auth`, 10/min); everything else requires a Sanctum token and is throttled `throttle:api` (120/min).

## Setup

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan vendor:publish --tag=permission-migrations
php artisan migrate --seed
php artisan serve
```
