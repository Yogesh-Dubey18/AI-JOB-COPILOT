# AI Job Copilot

[![CI](https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT/actions/workflows/ci.yml/badge.svg)](https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT/actions/workflows/ci.yml)
[![Security](https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT/actions/workflows/security.yml/badge.svg)](https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT/actions/workflows/security.yml)
[![Release Validation](https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT/actions/workflows/release-validation.yml/badge.svg)](https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT/actions/workflows/release-validation.yml)

Upload your resume once. Get matching jobs, tailored resumes, application help, and interview preparation until selection.

AI Job Copilot is a job-seeker focused AI SaaS platform. It is not an employer job-posting board and it does not auto-apply. It helps candidates analyze resumes, match jobs, create reviewable application content, track applications, prepare for interviews, learn missing skills, detect scams, and improve after rejection.

## Demo Positioning

This repository is a portfolio-ready full-stack SaaS demo for job seekers. It shows production-oriented architecture, typed frontend/backend code, MongoDB-ready persistence, JWT auth, AI provider fallbacks, SaaS plan foundations, admin operations, analytics, and deployment runbooks.

Honest scope:

- Provider-ready AI works with safe mock fallback when API keys are missing.
- Billing is mock/Stripe-ready and does not charge users.
- Job data is seeded/manual-source ready; it does not scrape protected job sites.
- Resume/application content is user-reviewed; the app does not auto-apply or auto-send messages.

## Live Demo URLs

Owner-provided deployment URLs:

- Frontend: https://ai-job-copilot-frontend.vercel.app/
- Backend: https://ai-job-copilot-backend-l6ut.onrender.com
- Backend health: https://ai-job-copilot-backend-l6ut.onrender.com/health

Live smoke testing should still be completed before presenting the deployment as production-ready. Keep provider secrets, MongoDB URI, JWT secrets, billing keys, email keys, and AI keys in hosting dashboards only.

## Recruiter-Friendly Highlights

- Built a complete monorepo with Next.js App Router frontend, Express TypeScript backend, shared types, and deployment docs.
- Implemented auth, onboarding, resume upload, ATS analysis, job matching, tailored resumes, application kits, tracker, interviews, analytics, notifications, admin, and SaaS plan foundations.
- Added safe AI architecture with mock fallback plus OpenAI/Gemini provider readiness.
- Added MongoDB/Mongoose models, in-memory local fallback, repository abstraction, and seed data.
- Added verification workflow with builds, tests, and Git safety checks.
- Documented deployment, security, limitations, demo flow, and handoff requirements.
- Added feedback-to-issue workflow with in-app feedback, admin triage, issue drafts, and privacy-aware improvement sprint docs.
- Added commercial readiness, legal review, support, incident response, refund/cancellation, and pricing validation templates that require professional review before paid launch.
- Added recruiter/demo storytelling package with pitch scripts, deck outline, walkthrough article, FAQ, LinkedIn posts, and showcase checklist.

Portfolio package docs:

- [Project Case Study](docs/project-case-study.md)
- [GitHub Repo Profile](docs/github-repo-profile.md)
- [LinkedIn Post](docs/linkedin-post.md)
- [Resume Project Bullets](docs/resume-project-bullets.md)
- [Interview Q&A](docs/interview-qa-ai-job-copilot.md)
- [Feedback To Release Loop](docs/feedback-to-release-loop.md)
- [Commercial Readiness Index](docs/commercial-readiness-index.md)
- [Presentation Package Index](docs/presentation-package-index.md)

## Product Readiness Audit Docs

- [Complete Product Audit Report](docs/complete-product-audit-report.md)
- [Advanced Real Product Roadmap](docs/advanced-real-product-roadmap.md)
- [Pending Gaps & Provider Blockers](docs/pending-gaps-and-provider-blockers.md)
- [Next Implementation Sprint Plan](docs/next-implementation-sprint-plan.md)
- [Browser Extension Safe Workflow](docs/browser-extension-safe-workflow.md)
- [Competitor Outperformance Strategy](docs/competitor-outperformance-strategy.md)
- [PDF Blueprint Gap Map](docs/pdf-blueprint-gap-map.md)

## Monorepo

- `frontend`: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-compatible components, TanStack Query, React Hook Form, Zod, Recharts, Framer Motion, Lucide, dark mode, PWA-ready public manifest.
- `backend`: Express.js, TypeScript, MongoDB/Mongoose models, JWT access token, refresh token httpOnly cookies, bcrypt, Multer, optional Cloudinary, optional Redis/BullMQ fallback, AI provider integration with mock fallback.
- `shared`: Shared TypeScript types and Zod schemas.
- `docs`: API, database, setup, roadmap, and deployment documentation.

Start with [START_HERE.md](START_HERE.md), [Final Master Index](docs/final-master-index.md), [Project Operating Manual](docs/project-operating-manual.md), and [docs/README.md](docs/README.md) for the complete documentation map.

## Local Setup

~~~bash
npm install
npm run install:all
npm run seed --prefix backend
npm run dev
~~~

Frontend: http://localhost:3000
Backend: http://localhost:5000

## Useful Commands

~~~bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
npm run check:docs
npm run check:security
npm run build --prefix frontend
npm run build --prefix backend
npm test
npm test --prefix frontend
npm test --prefix backend
npm run test:e2e --prefix frontend
npm run seed --prefix backend
~~~

## Verification Snapshot

Current local verification loop:

~~~bash
npm run check:git-safety
npm run build
npm test
npm run build --prefix backend
npm test --prefix backend
npm run build --prefix frontend
npm test --prefix frontend
~~~

Known non-fatal local warnings:

- Frontend tests print a Recharts zero-size warning under jsdom for responsive charts.
- On Node 24, Next.js may print an experimental type-stripping warning while compiling.

## v2 Beta Status

Current beta release: `v2.0.0-beta`

This beta is suitable for local portfolio review and controlled demo testing. It includes v2 resume intelligence, job source normalization, application follow-up intelligence, notifications, AI guardrails, SaaS usage limits, admin operations, audit logs, privacy export/delete, public portfolio, advanced analytics, interview coach, local PDF exports, Chrome extension foundation, and PWA/mobile offline polish.

Beta docs:

- [Release Notes v2 Beta](docs/release-notes-v2-beta.md)
- [v2 Beta Readiness Checklist](docs/v2-beta-readiness-checklist.md)
- [v2 Beta Testing Plan](docs/v2-beta-testing-plan.md)
- [v2 Beta Manual Actions](docs/v2-beta-manual-actions.md)
- [v2 Stabilization Bug Tracker](docs/v2-stabilization-bug-tracker.md)
- [Playwright E2E Testing Guide](docs/playwright-e2e-testing.md)

Still pending for real production use: live deployment verification, provider credentials, object storage, Chrome Web Store packaging, and professional legal/commercial review.

## v2 Stable Status

Current stable source release: `v2.0.0`

This stable release means the repository has a verified v2 architecture, documentation, local build/test loop, safety checks, and deployment runbooks. Live demo URLs have been provided, but production readiness still depends on live smoke testing, provider configuration, monitoring, and manual operations review.

Stable release docs:

- [Release Notes v2 Stable](docs/release-notes-v2-stable.md)
- [v2 Production Env Checklist](docs/v2-production-env-checklist.md)
- [v2 Production Deployment Verification](docs/v2-production-deployment-verification.md)
- [v2 Production Smoke Test Report](docs/v2-production-smoke-test-report.md)
- [v2 Production Go-Live Manual](docs/v2-production-go-live-manual.md)
- [v2 Stable Release Closure](docs/v2-stable-release-closure.md)

Production launch remains pending until MongoDB Atlas, provider secrets, CORS, monitoring, and live smoke tests are configured and verified with real values.

## Environment

Copy `.env.example`, `frontend/.env.example`, and `backend/.env.example`. Add MongoDB Atlas URI and JWT secrets for production. AI keys are optional because the app has structured mock fallback responses.

Provider-ready integrations are documented as placeholders until approved credentials are available:

- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI` enable official LinkedIn OAuth/profile-import work only when the app is approved for the needed scopes.
- `INDEED_API_KEY`, `ZIPRECRUITER_API_KEY`, `DICE_API_KEY`, and `NAUKRI_API_KEY` are reserved for approved APIs or partner feeds. The app must not scrape protected job boards.
- `COURSE_PROVIDER`, `COURSERA_API_KEY`, `UDEMY_CLIENT_ID`, and `UDEMY_CLIENT_SECRET` are reserved for skill-gap learning resources. Mock learning plans remain available without keys.
- `STORAGE_PROVIDER`, `STORAGE_BUCKET_NAME`, `STORAGE_REGION`, `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, and `STORAGE_SIGNED_URL_TTL_SECONDS` are placeholders for private S3/R2 object storage. Local uploads remain the development fallback and are not production-durable.

The product keeps applications user-reviewed. It can open official apply URLs and generate checklists/drafts, but it must not auto-submit applications or auto-send recruiter messages unless a future provider explicitly supports it and the user confirms each action.

See [Provider Integrations](docs/provider-integrations.md) for job-board, OAuth, storage, and course-provider setup notes.

## Deployment Readiness

AI Job Copilot is structured for split deployment:

- Frontend: Vercel, root directory `frontend`, build command `npm run build`.
- Backend: Render, Railway, or Fly.io, root directory `backend`, build command `npm install && npm run build`, start command `npm start`.
- Database: MongoDB Atlas via `MONGO_URI`.

Production environment variables are documented in [Deployment Guide](docs/deployment-guide.md), [Production Checklist](docs/production-checklist.md), and [Security Checklist](docs/security-checklist.md). Do not add real keys to the repo. Use provider dashboards for secrets.

Final deployment execution docs:

- [Final Deployment Values](docs/final-deployment-values.md)
- [Final MongoDB Atlas Setup](docs/final-mongodb-atlas-setup.md)
- [Final Backend Deployment](docs/final-backend-deployment.md)
- [Final Frontend Deployment](docs/final-frontend-deployment.md)
- [Final Production Launch Checklist](docs/final-production-launch-checklist.md)
- [Final Live URL Update](docs/final-live-url-update.md)

Backend health check:

~~~bash
GET https://ai-job-copilot-backend-l6ut.onrender.com/health
~~~

Expected safe response:

~~~json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "AI Job Copilot API"
  }
}
~~~

Frontend API configuration:

~~~bash
NEXT_PUBLIC_API_URL=https://ai-job-copilot-backend-l6ut.onrender.com/api
~~~

Live URLs are documented above because they were provided by the project owner. Do not add or commit secrets; use hosting dashboards for environment variables.

## Demo Flow

1. Register and log in.
2. Complete onboarding.
3. Upload a resume.
4. Analyze ATS score.
5. Review matching jobs.
6. Open a job detail page.
7. Tailor a resume.
8. Generate an application kit.
9. Track the application.
10. Generate interview prep and view analytics.

See [Demo Script](docs/demo-script.md) and [Launch Checklist](docs/launch-checklist.md).

## Master Navigation

- [Start Here](START_HERE.md)
- [Final Master Index](docs/final-master-index.md)
- [Project Operating Manual](docs/project-operating-manual.md)
- [Project Command Center](docs/project-command-center.md)
- [Final Project Readiness Dashboard](docs/final-project-readiness-dashboard.md)
- [Final Archive Checklist](docs/final-archive-checklist.md)
- [Final Master Handoff v2](docs/final-master-handoff-v2.md)
- [Final Project Closure](docs/final-project-closure.md)
- [Final Next 7 Days Action Plan](docs/final-next-7-days-action-plan.md)
- [Final Issue-Based Roadmap](docs/final-issue-based-roadmap.md)
- [Final Do Not Overclaim Guide](docs/final-do-not-overclaim-guide.md)
- [Final Repo Owner Checklist](docs/final-repo-owner-checklist.md)
- [Release Notes v1.0.0](docs/release-notes-v1.0.0.md)
- [Final Freeze Checklist](docs/final-freeze-checklist.md)
- [Documentation Quality Audit](docs/documentation-quality-audit.md)
- [Final Next Actions](docs/final-next-actions.md)
- [Agent Guide](AGENTS.md)

## Handover

Future maintainers should start with [START_HERE.md](START_HERE.md), [Final Master Handoff v2](docs/final-master-handoff-v2.md), [Final Handover](docs/final-handover.md), [Developer Onboarding](docs/developer-onboarding.md), and [Final Manual Actions](docs/final-manual-actions.md). Current phase status is tracked in [PHASE_PROGRESS.md](PHASE_PROGRESS.md).

Phase-based expansion is closed after Phase 50. Future work should be managed through focused GitHub issues, small pull requests, and release notes.
