# Release Notes v2 Stable

Release: `v2.0.0`

Date: 2026-05-21

## Summary

AI Job Copilot v2.0.0 is a stable source, documentation, and architecture release for portfolio demos and production deployment preparation. It does not claim a live hosted production deployment until real URLs and provider dashboards are configured.

## Included

- Resume intelligence v2 with deterministic ATS scoring, role keyword banks, and parser fallbacks.
- Job source normalization, duplicate checks, trust scoring, scam signals, manual import architecture, and CSV import planning.
- Application tracker intelligence with timelines, follow-up reminders, stage insights, and application quality guidance.
- Notification center, mock email/calendar architecture, reminder dashboard, and preference foundations.
- AI provider abstraction with mock, Gemini, and OpenAI-ready architecture, prompt templates, schema validation, retry/timeout handling, guardrails, and usage tracking.
- SaaS billing architecture with plan limits, usage events, mock billing, and Stripe-ready documentation.
- Admin operations with audit logs, system health, risk signals, and usage analytics.
- Security hardening with env validation, JWT flow review, rate limiting, CORS guidance, security checks, and audit logging.
- Testing, CI/CD, observability, privacy export/delete, public portfolio, advanced analytics, interview coach, PDF export, Chrome extension, and PWA/mobile foundations.

## Verified Locally

- Root build and tests.
- Backend build and tests.
- Frontend build and tests.
- Extension build and tests.
- Documentation link checks.
- Security safety checks.
- Git safety checks.
- E2E command skip-safe path when Playwright is not installed.

## Production Pending

- Real frontend/backend live URLs.
- MongoDB Atlas project configuration.
- Provider credentials for AI, email, billing, monitoring, and object storage.
- Active Playwright E2E run after installing Playwright.
- Chrome Web Store packaging and privacy review.
- Professional review of legal, privacy, commercial, refund, and support templates.

## Upgrade Notes

- Keep mock providers enabled until real keys are configured.
- Do not expose server-only provider keys in frontend env variables.
- Update CORS with the real frontend origin before public demos.
- Use [v2 Production Go-Live Manual](v2-production-go-live-manual.md) before a real launch.
