# Testing

Polymind ships with unit, component, and end-to-end tests on the frontend and
PHPUnit tests on the backend.

## Frontend (`app/`)

| Command | What it does |
| --- | --- |
| `npm run test` | Run unit + component tests once (Vitest) |
| `npm run test:watch` | Watch mode |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Coverage report (v8) |
| `npm run test:e2e` | Playwright end-to-end tests |

**Stack:** Vitest + jsdom + Testing Library. Global setup lives in
`src/test/setup.ts` (jest-dom matchers plus `matchMedia` / `ResizeObserver`
stubs that jsdom does not provide).

Unit and component specs live beside the code they cover and are named
`*.test.ts` / `*.test.tsx`. They are excluded from the production `tsc` build via
`tsconfig.app.json`.

End-to-end specs live in `e2e/` and run against a preview build. Install the
browser once before the first run:

    npx playwright install --with-deps chromium

### What is covered today

- `src/lib/utils.test.ts` — class merging, id generation, relative time.
- `src/store/useStore.test.ts` — preferences persistence, workspace/profile
  updates, theme toggling.
- `src/shared/components/ErrorBoundary.test.tsx` — fallback rendering.
- `e2e/smoke.spec.ts` — app boots, title is set, composer is reachable.

## Backend (`backend/`)

    php artisan test          # or: ./vendor/bin/phpunit

Tests use an in-memory SQLite database (see `phpunit.xml`).

- `tests/Feature/AuthTest.php` — register / login / invalid credentials.
- `tests/Unit/CostCalculatorTest.php` — token cost estimation.

## CI

`.github/workflows/ci.yml` runs three jobs on every push and pull request:

1. **Backend** — Larastan, Pint, and PHPUnit against Postgres/SQLite.
2. **Frontend** — ESLint, Vitest, and the production build.
3. **E2E** — Playwright (Chromium) against a preview build.
