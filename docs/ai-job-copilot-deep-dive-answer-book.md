# AI Job Copilot Deep Dive Answer Book

## Architecture

AI Job Copilot is a monorepo with frontend, backend, shared types, docs, and scripts. The frontend handles user workflows, while the backend manages auth, data, AI calls/fallbacks, and APIs.

## Backend

- Express routes.
- Services.
- Mongoose-ready models.
- JWT auth.
- Rate limits.
- Helmet and CORS.
- AI provider abstraction.

## Frontend

- Next.js App Router.
- Dashboard pages.
- Resume, jobs, applications, interviews, analytics, admin, settings.
- Reusable UI components.
- API client with credentials.

## Tradeoffs

- Mock fallback keeps local demo stable.
- E2E tests are planned.
- Live provider setup requires real credentials.
- Auto-apply is intentionally excluded.
