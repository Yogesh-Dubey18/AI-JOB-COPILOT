# AI Job Copilot Start Here

This is the first file to open when returning to the project.

## Current State

- Repository: AI Job Copilot full-stack job-seeker SaaS portfolio project.
- Version state: v2 stable source release plus final archive/handoff package.
- Live deployment: pending until real hosting credentials, provider secrets, and live URLs are configured.
- AI, email, billing, calendar, and monitoring providers: mock/provider-ready unless environment variables are supplied.
- Future work mode: issue-based only after Phase 50. Do not create more phase expansion.

## Fast Path

1. Read [README.md](README.md) for product scope, setup, commands, and deployment posture.
2. Read [docs/README.md](docs/README.md) for the full documentation map.
3. Read [PHASE_PROGRESS.md](PHASE_PROGRESS.md) for the completed phase history.
4. Read [docs/final-master-handoff-v2.md](docs/final-master-handoff-v2.md) for the current handoff.
5. Use [docs/project-command-center.md](docs/project-command-center.md) for daily operating commands.
6. Use [docs/final-next-7-days-action-plan.md](docs/final-next-7-days-action-plan.md) for immediate next actions.

## Verify Locally

~~~bash
npm run check:git-safety
npm run check:security
npm run check:docs
npm run build
npm test
npm run build --prefix backend
npm test --prefix backend
npm run build --prefix frontend
npm test --prefix frontend
npm run build --prefix extension
npm test --prefix extension
npm run test:e2e --prefix frontend
npm run typecheck
npm run lint
~~~

The E2E command is currently skip-safe unless `@playwright/test` is installed.

## Manual Setup Still Required

- Create production secrets in hosting dashboards, never in Git.
- Configure MongoDB Atlas and set `MONGO_URI`.
- Configure backend host and frontend host.
- Set `NEXT_PUBLIC_API_URL` to the real backend `/api` URL.
- Configure CORS with the real frontend URL.
- Add AI provider keys only when real AI usage is intended.
- Replace mock billing/email/calendar/monitoring providers only after credentials and operating process are ready.
- Run live smoke tests before sharing a public demo link.

## Stop Condition

Phase-based expansion ends at Phase 50. New work should be tracked as small issues:

1. Deploy backend and frontend.
2. Update live URLs after verification.
3. Update resume and LinkedIn using the prepared assets.
4. Start the first 100 applications campaign.
5. Collect real feedback.
6. Create GitHub issues.
7. Improve issue-by-issue.
