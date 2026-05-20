# Project Command Center

Use this page during active work.

## Current State

- Repository: AI Job Copilot monorepo.
- Frontend: Next.js App Router.
- Backend: Express TypeScript API.
- Database: MongoDB/Mongoose-ready with local fallback patterns.
- AI: mock fallback plus provider-ready architecture.
- Deployment: documented, not live until owner supplies real platform values.

## Command Shortcuts

| Task | Command |
| --- | --- |
| Install root dependencies | `npm install` |
| Install app dependencies | `npm run install:all` |
| Start both apps | `npm run dev` |
| Start frontend | `npm run dev:frontend` |
| Start backend | `npm run dev:backend` |
| Build everything | `npm run build` |
| Test everything | `npm test` |
| Seed backend | `npm run seed --prefix backend` |
| Check Git safety | `npm run check:git-safety` |
| Check docs links | `npm run check:docs` |

## Phase Continuation Rule

If work pauses, resume from the last incomplete entry in `PHASE_PROGRESS.md`. Do not restart from Phase 1 unless the owner explicitly requests a rebuild.

## Push Rule

Only push when a Git remote exists and authentication succeeds. If no remote exists, record that push was skipped and continue local phase work.

## Manual Values Needed Later

- `FRONTEND_LIVE_URL`
- `BACKEND_LIVE_URL`
- `BACKEND_HEALTH_URL`
- MongoDB Atlas URI
- JWT secrets
- AI provider keys
- Email/billing/monitoring provider credentials

