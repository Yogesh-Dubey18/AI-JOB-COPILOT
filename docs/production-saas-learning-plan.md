# Production SaaS Learning Plan

AI Job Copilot is a portfolio SaaS architecture. This plan shows what to learn before treating it as a real commercial SaaS.

## Core Topics

- Authentication, sessions, refresh tokens, password reset, and role protection.
- Multi-tenant data isolation and privacy controls.
- AI request cost tracking and usage limits.
- Billing provider integration with test mode first.
- Logging, monitoring, incident response, and rollback.
- Deployment, env management, health checks, and CORS.
- Support workflow, feedback triage, and release management.

## Practice Tasks

1. Trace one request from frontend button to database write.
2. Explain how a failed AI provider call falls back safely.
3. Add a feature flag around one non-critical feature.
4. Add a usage limit check for one AI endpoint.
5. Write a runbook for one production incident.

## Production Honesty Rules

- Do not claim real billing until payment provider keys, webhook verification, and legal review are complete.
- Do not claim guaranteed jobs or selection.
- Do not expose secret keys in frontend code or docs.
- Do not store more personal data than the product needs.

