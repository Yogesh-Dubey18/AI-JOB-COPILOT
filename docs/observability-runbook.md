# Observability Runbook

Use this runbook when debugging production or demo issues.

## First Checks

1. Open backend `/health`.
2. Open backend `/ready`.
3. Open backend `/status`.
4. Confirm frontend `NEXT_PUBLIC_API_URL` points to the backend `/api` URL.
5. Check the response `X-Request-Id` header and match it with backend logs.

## Request IDs

Every backend request receives an `X-Request-Id` response header. Clients may send `X-Request-Id`; otherwise the API generates one.

Use request IDs in:

- Support notes.
- Backend logs.
- Admin audit log reviews.
- Deployment smoke test reports.

## Structured Logs

Backend logs are JSON objects with:

- `level`
- `event`
- `timestamp`
- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`
- `userId` when available

Test runs suppress non-error structured logs to keep local output usable.

## Admin Monitoring

Admins can inspect monitoring and provider state at:

- Frontend: `/admin/monitoring`
- Backend: `GET /api/admin/monitoring`

This view is secret-free and should not show API keys, DSNs, connection strings, access tokens, or raw prompts.

## Incident Triage

- 5xx API errors: check request ID, route, recent deployment, provider status, and MongoDB mode.
- AI fallback spike: verify AI provider env keys and timeout settings.
- Email/calendar not sending: verify provider status and mock-safe notes before assuming external delivery.
- CORS errors: verify `CLIENT_URL` includes the exact frontend origin.
- Frontend error boundary: capture the digest and check matching API failures.

## Escalation

External dashboard access may be required for:

- Hosting logs.
- MongoDB Atlas metrics.
- Sentry events.
- Vercel function/build logs.
- Render/Railway/Fly.io deploy logs.
