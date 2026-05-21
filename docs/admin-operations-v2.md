# Admin Operations v2

AI Job Copilot v2 adds admin operations endpoints and pages for safer product operation. These tools are for internal review only and require the `admin` role.

## Admin Routes

- `GET /api/admin/users`
- `GET /api/admin/jobs`
- `POST /api/admin/jobs`
- `PUT /api/admin/jobs/:id`
- `DELETE /api/admin/jobs/:id`
- `GET /api/admin/ai-usage`
- `GET /api/admin/usage-analytics`
- `GET /api/admin/audit-logs`
- `GET /api/admin/system-health`
- `GET /api/admin/risk-signals`
- `GET /api/admin/reports`
- `GET /api/admin/feedback`

## System Health

The system health endpoint returns safe operational metadata only:

- database mode
- AI provider mode and model
- billing provider mode
- record counts
- check timestamp

It must not return secrets, connection strings, API keys, or private provider details.

## Risk Signals

Risk signals summarize high-level operational issues:

- high-risk job records
- AI fallback/mock rate
- denied admin access events
- scam report count

These are signals for review, not automated enforcement decisions.

## Admin UI

The admin dashboard now links to:

- users
- jobs
- AI usage
- usage analytics
- audit logs
- system health
- risk signals
- feedback
- product analytics

## Limitations

- Admin creation is still manual through database role updates.
- Audit retention policy is documented separately and should be formalized before real production launch.
- Risk signals are deterministic summaries, not fraud detection guarantees.
