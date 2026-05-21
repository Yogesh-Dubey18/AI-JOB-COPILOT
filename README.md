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

## Recruiter-Friendly Highlights

- Built a complete monorepo with Next.js App Router frontend, Express TypeScript backend, shared types, and deployment docs.
- Implemented auth, onboarding, resume upload, ATS analysis, job matching, tailored resumes, application kits, tracker, interviews, analytics, notifications, admin, and SaaS plan foundations.
- Added safe AI architecture with mock fallback plus OpenAI/Gemini provider readiness.
- Added MongoDB/Mongoose models, in-memory local fallback, repository abstraction, and seed data.
- Added verification workflow with builds, tests, and Git safety checks.
- Documented deployment, security, limitations, demo flow, and handoff requirements.

Portfolio package docs:

- [Project Case Study](docs/project-case-study.md)
- [GitHub Repo Profile](docs/github-repo-profile.md)
- [LinkedIn Post](docs/linkedin-post.md)
- [Resume Project Bullets](docs/resume-project-bullets.md)
- [Interview Q&A](docs/interview-qa-ai-job-copilot.md)

## Monorepo

- `frontend`: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-compatible components, TanStack Query, React Hook Form, Zod, Recharts, Framer Motion, Lucide, dark mode, PWA-ready public manifest.
- `backend`: Express.js, TypeScript, MongoDB/Mongoose models, JWT access token, refresh token httpOnly cookies, bcrypt, Multer, optional Cloudinary, optional Redis/BullMQ fallback, AI provider integration with mock fallback.
- `shared`: Shared TypeScript types and Zod schemas.
- `docs`: API, database, setup, roadmap, and deployment documentation.

Start with [Final Master Index](docs/final-master-index.md), [Project Operating Manual](docs/project-operating-manual.md), and [docs/README.md](docs/README.md) for the complete documentation map.

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

## Environment

Copy `.env.example`, `frontend/.env.example`, and `backend/.env.example`. Add MongoDB Atlas URI and JWT secrets for production. AI keys are optional because the app has structured mock fallback responses.

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
GET https://your-backend-host.example.com/health
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
NEXT_PUBLIC_API_URL=https://your-backend-host.example.com/api
~~~

No live URLs are committed until they are provided and verified.

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

- [Final Master Index](docs/final-master-index.md)
- [Project Operating Manual](docs/project-operating-manual.md)
- [Project Command Center](docs/project-command-center.md)
- [Final Project Readiness Dashboard](docs/final-project-readiness-dashboard.md)
- [Release Notes v1.0.0](docs/release-notes-v1.0.0.md)
- [Final Freeze Checklist](docs/final-freeze-checklist.md)
- [Documentation Quality Audit](docs/documentation-quality-audit.md)
- [Final Next Actions](docs/final-next-actions.md)
- [Agent Guide](AGENTS.md)

## Handover

Future maintainers should start with [Final Handover](docs/final-handover.md), [Developer Onboarding](docs/developer-onboarding.md), and [Final Manual Actions](docs/final-manual-actions.md). Current phase status is tracked in [PHASE_PROGRESS.md](PHASE_PROGRESS.md).
