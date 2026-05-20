# AI Job Copilot Project Explanation

## Short Explanation

AI Job Copilot is a full-stack AI-powered job-search assistant for job seekers. It helps users upload a resume, analyze ATS readiness, find matching jobs, tailor resumes, generate application materials, track applications, prepare for interviews, detect scam jobs, and review analytics.

## Technical Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS.
- Backend: Node.js, Express.js, TypeScript.
- Database architecture: MongoDB/Mongoose-ready models with fallback behavior for local/demo use.
- Auth: JWT-based architecture with password hashing.
- AI: provider-ready service with mock fallback for missing OpenAI/Gemini keys.
- Testing: Vitest and Supertest for backend, Vitest for frontend page rendering.
- Deployment: Vercel frontend, Render/Railway/Fly backend, MongoDB Atlas.

## Architecture Story

The system is organized as a monorepo with separate frontend, backend, shared types, docs, and scripts. The backend uses route, controller/service, model, middleware, and AI provider layers. The frontend uses reusable dashboard, form, analytics, jobs, resume, and application views.

## Honest Limitations

- Live deployment URLs are pending until platform access is configured.
- AI providers use mock fallback unless API keys are set.
- Job ingestion is provider-ready, not scraping protected sites.
- Auto-apply is intentionally not implemented.
