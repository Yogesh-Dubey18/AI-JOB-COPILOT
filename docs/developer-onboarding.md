# Developer Onboarding

## Prerequisites

- Node.js 20 or compatible.
- npm.
- MongoDB Atlas for production persistence.
- Optional provider accounts for AI, email, billing, monitoring.

## Install

```bash
npm install
npm run install:all
```

## Run Locally

```bash
npm run dev
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:5000`

## Verify

```bash
npm run check:git-safety
npm run check:docs
npm run build
npm test
```

## Important Areas

- `frontend/app`: pages and routes.
- `backend/src`: API, services, models, AI, middleware.
- `shared`: shared types/schemas.
- `docs`: runbooks and handoff docs.
- `scripts`: repository safety tooling.
