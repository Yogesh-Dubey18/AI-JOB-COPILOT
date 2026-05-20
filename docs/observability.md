# Observability

AI Job Copilot currently has lightweight local observability and is ready for provider-backed monitoring.

## Current Signals

- Backend request audit logs print route, method, and user ID when available.
- `/health` returns safe service status.
- AI requests are recorded through the `AIRequest` model/repository path with feature, provider/model, status, and error fields.
- Test output verifies auth, resume, job match, application, and interview prep flows.

## Health Endpoint

```bash
GET /health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "AI Job Copilot API"
  }
}
```

## Recommended Production Additions

- Request ID middleware.
- JSON structured logger.
- Error tracking provider such as Sentry.
- Uptime checks against `/health`.
- Log privacy filter for resume text, tokens, and provider credentials.
- Queue health checks when Redis/BullMQ is enabled.
- Admin monitoring page for AI usage, errors, and job import status.

## Alerting Targets

- Backend health endpoint unavailable.
- 5xx rate exceeds baseline.
- AI provider fallback rate spikes.
- MongoDB connection failures.
- Resume upload failures.
- Email provider delivery failures.

## Log Privacy

Do not log:

- JWT tokens or refresh tokens.
- API keys.
- MongoDB connection strings.
- Resume file contents.
- Full recruiter messages with private user context.
- Uploaded document paths beyond safe relative references.
