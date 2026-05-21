# Sentry Monitoring Setup

Sentry is provider-ready but not enabled by default. The current monitoring mode is `noop` unless Sentry environment values are configured outside git.

## Backend Environment

Set these only in the backend hosting dashboard:

~~~bash
MONITORING_PROVIDER=sentry
SENTRY_DSN=your_backend_sentry_dsn
LOG_LEVEL=info
~~~

## Frontend Environment

Set these only in the frontend hosting dashboard:

~~~bash
NEXT_PUBLIC_MONITORING_PROVIDER=sentry
NEXT_PUBLIC_SENTRY_DSN=your_frontend_sentry_dsn
~~~

Frontend Sentry DSNs are public identifiers, but they still should be configured through deployment env values instead of hardcoded in source.

## Current Code Boundary

- Backend has `captureException` and `getMonitoringStatus` in `backend/src/services/monitoring.service.ts`.
- Frontend has `captureFrontendException` in `frontend/lib/monitoring.ts`.
- Root frontend `app/error.tsx` captures client boundary errors.
- External Sentry SDK installation is a future step and should be reviewed before adding packages.

## Safety Rules

- Never commit DSNs, auth tokens, org slugs, project tokens, source map upload tokens, or release credentials.
- Do not upload source maps from local machines unless release automation is configured.
- Keep PII out of tags, breadcrumbs, and custom context.
- Redact resumes, application messages, recruiter emails, and raw AI prompts before external monitoring.
