# Final Master Index

This is the owner and maintainer map for AI Job Copilot. Start here when you need to understand, demo, deploy, or continue the project.

## Start Here

1. [Project Operating Manual](project-operating-manual.md)
2. [Project Command Center](project-command-center.md)
3. [Final Project Summary](final-project-summary.md)
4. [Final Manual Actions](final-manual-actions.md)
5. [Known Limitations](known-limitations.md)
6. [PHASE_PROGRESS](../PHASE_PROGRESS.md)

## Build And Verification

- Root install: `npm install`
- Install workspaces: `npm run install:all`
- Full build: `npm run build`
- Full tests: `npm test`
- Git safety: `npm run check:git-safety`
- Docs links: `npm run check:docs`

## Deployment Path

1. Configure MongoDB Atlas.
2. Deploy backend with placeholder-safe environment variables.
3. Confirm `/health`.
4. Deploy frontend with `NEXT_PUBLIC_API_URL`.
5. Update live URLs only after verification.

Use [Deployment Runbook](deployment-runbook.md), [Final Backend Deployment](final-backend-deployment.md), and [Final Frontend Deployment](final-frontend-deployment.md).

## Product Areas

- Resume intelligence: upload, parse, analyze, improve, version, export foundation.
- Job intelligence: seeded/manual jobs, match scoring, trust/scam signals, daily feed.
- Application workflow: application kit, tracker, follow-ups, interview rounds.
- Interview coaching: preparation plans, mock scoring, project/HR readiness.
- Career system: job search, outreach, resume/LinkedIn, interview, offer, and long-term roadmap docs.
- SaaS operations: plans, usage tracking, billing-ready mock, admin, analytics, audit/logging foundations.

## Honesty Rules

- Do not claim real deployment until live URLs are provided and smoke-tested.
- Do not claim paying users, customers, revenue, or investors.
- Do not claim AI guarantees job selection.
- Keep provider-ready features labeled as mock/provider-ready until keys and platform setup exist.
- Keep all generated application content user-reviewed.

