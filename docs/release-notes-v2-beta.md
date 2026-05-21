# Release Notes v2.0.0-beta

Release date: 2026-05-21

AI Job Copilot v2.0.0-beta is a local beta architecture release for portfolio/demo review. It adds deeper product intelligence, privacy controls, exports, browser assistant foundations, and mobile/PWA polish.

## Highlights

- Improved resume parsing and deterministic ATS scoring.
- Added role keyword banks for React, MERN, Node, Frontend, and Full Stack roles.
- Added job source normalization, duplicate detection, and trust scoring.
- Upgraded the application tracker with timeline and follow-up intelligence.
- Added notification, mock email, and calendar-ready foundations.
- Upgraded AI provider, prompt, schema, guardrail, and usage tracking architecture.
- Added SaaS billing and usage limit foundations.
- Added admin operations, audit logs, health, monitoring, and risk signals.
- Added privacy export and delete account system.
- Added public portfolio generator with privacy controls.
- Added advanced analytics and job-search intelligence.
- Added interview coach sessions, question banks, readiness scoring, and history.
- Added real local PDF exports for resumes, tailored resumes, application kits, portfolios, and interview prep.
- Added Manifest V3 Chrome extension foundation for manual job capture.
- Added PWA install helper, offline fallback route, and mobile shell polish.

## Verification

Latest Phase 45 verification should include:

- `npm run check:git-safety`
- `npm run check:security`
- `npm run check:docs`
- `npm run build`
- `npm test`
- `npm run build --prefix extension`
- `npm test --prefix extension`
- `npm run test:e2e --prefix frontend`
- `npm run typecheck`
- `npm run lint`

## Known Beta Boundaries

- This is not a verified live deployment.
- E2E tests are skip-safe unless Playwright is installed.
- Extension is not packaged for Chrome Web Store.
- Provider integrations remain mock/provider-ready unless environment variables are configured.
- Legal, privacy, refund, and commercial docs are templates requiring professional review.
