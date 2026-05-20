# Security Hardening

This document tracks production hardening implemented in Phase 3 and remaining work.

## Implemented

- Helmet is enabled.
- Express hides `x-powered-by`.
- CORS checks the configured frontend origin instead of using a wildcard.
- Rate limits are enabled for API routes and stricter AI routes.
- Rate limits are skipped in tests to keep test results deterministic.
- Backend errors hide unexpected implementation details in production.
- JWT auth middleware protects user routes.
- Admin middleware enforces admin role checks.
- Upload middleware limits resume size and MIME types.
- MongoDB connection uses bounded pool and selection timeout settings.
- AI calls use timeout, retry, mock fallback, and response schema validation.
- Provider secrets remain backend-only.

## Required Production Settings

Set these as provider secrets, not committed files:

```bash
NODE_ENV=production
CLIENT_URL=https://your-frontend-host.example.com
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
AI_PROVIDER=auto
AI_TIMEOUT_MS=12000
AI_RETRY_ATTEMPTS=1
```

## Manual Review Before Public Users

- Confirm deployed CORS allows only the real frontend URL.
- Rotate JWT secrets if they were ever shared.
- Review upload storage behavior for the chosen backend host.
- Add real monitoring and alerting.
- Add account deletion and data export before handling sensitive real user data.
- Add dependency/security scanning in CI.

## AI Guardrails

- Resume tailoring must not invent experience.
- Application messages must remain user-reviewed.
- Recruiter messages must not be sent automatically.
- AI provider failures must fall back safely without breaking core flows.

## Remaining Work

- Request IDs and structured production logs.
- Centralized audit logs for all sensitive actions.
- Security headers review after live deployment.
- Brute-force protection and account lockout policy.
- Formal privacy, retention, and incident response policies.
