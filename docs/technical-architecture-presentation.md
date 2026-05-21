# Technical Architecture Presentation

## Slide 1: Product

AI Job Copilot: personal AI career assistant for job seekers.

## Slide 2: System Overview

- Frontend: Next.js App Router, TypeScript, Tailwind.
- Backend: Express TypeScript API.
- Data: MongoDB/Mongoose-ready repository with local memory fallback.
- AI: provider abstraction with mock, Gemini, and OpenAI-ready flows.
- Ops: docs, safety checks, CI/CD plans, monitoring-ready architecture.

## Slide 3: Core Domains

- Auth and profile.
- Resume parsing and ATS analysis.
- Jobs and matching.
- Tailored resumes and application kits.
- Applications and interviews.
- Analytics, notifications, admin, feedback, privacy.

## Slide 4: Security

- JWT access token and httpOnly refresh cookies.
- CORS and helmet.
- Rate limits.
- Zod validation.
- User data isolation.
- Audit logging.
- Git safety and secret checks.

## Slide 5: AI Safety

- Mock fallback when keys are missing.
- Provider timeout and retry controls.
- Schema validation.
- Guardrails against fake experience and auto-send behavior.
- Usage tracking and plan limits.

## Slide 6: Deployment

- Frontend on Vercel.
- Backend on Render/Railway/Fly.io.
- MongoDB Atlas.
- Provider secrets in dashboards only.
- Live URL docs remain placeholders until verified.
