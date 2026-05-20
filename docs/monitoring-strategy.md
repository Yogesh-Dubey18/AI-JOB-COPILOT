# Monitoring Strategy

AI Job Copilot needs practical monitoring before a public demo and stronger observability before commercial use.

## Current Foundation

- Backend request logging exists for API requests.
- Health endpoint documentation exists.
- Git safety checks prevent accidental secret or build-output commits.
- Mock/provider-ready architecture keeps local development stable when real providers are missing.

## Production Monitoring Goals

- Confirm backend health.
- Confirm frontend loads.
- Track API error rate.
- Track AI provider failures and fallback usage.
- Track email/reminder failures.
- Track slow endpoints.
- Track failed auth attempts.

## Recommended Tools

- Host health checks from Render/Railway/Fly.
- Uptime monitor for frontend and backend.
- Sentry or similar for frontend/backend errors.
- Provider dashboards for AI, email, billing, and database.
- MongoDB Atlas metrics.

## Alert Levels

- Critical: app unavailable, auth broken, database unavailable, secrets exposed.
- High: AI provider failing without fallback, resume upload failing, application tracker unavailable.
- Medium: slow jobs endpoint, email reminders delayed, analytics stale.
- Low: UI warnings, documentation drift.
