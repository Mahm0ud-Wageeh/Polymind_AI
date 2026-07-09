# Security

## Transport & headers

Every response passes through `App\Http\Middleware\SecurityHeaders`, which sets:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 0` (modern browsers rely on CSP instead)
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Strict-Transport-Security` (only over HTTPS in production)

## Authentication & authorization

- Laravel Sanctum: stateful SPA cookies for the first-party frontend and bearer
  tokens for API clients.
- Role / permission checks via spatie/laravel-permission, exposed as the `role`
  and `permission` route middleware.

## Rate limiting

- `throttle:auth` — 10 requests/min on auth endpoints.
- `throttle:api` — 120 requests/min on the general API.

## CORS

Configured in `config/cors.php`: credentials enabled, origins restricted to
`FRONTEND_URL` and the local dev origin.

## Recommended for deployment

- Terminate TLS at the proxy and force HTTPS end-to-end.
- Keep `APP_KEY` secret and rotate AI provider keys via environment secrets.
- Add a Content-Security-Policy tuned to your asset/API origins.
- Run `composer audit` and `npm audit` in CI.
