# Deployment Automation Plan

This plan describes the safe path from verified code to hosted demo. It does not assume dashboard access or provider credentials.

## Current State

- CI verifies build, test, docs, security safety, and git safety.
- Deployment remains manual through Vercel for `frontend` and Render/Railway/Fly.io for `backend`.
- MongoDB Atlas, AI providers, email, billing, and monitoring require external dashboards and secret configuration.

## Frontend Automation Path

1. Connect the GitHub repository to Vercel.
2. Set project root to `frontend`.
3. Use build command `npm run build`.
4. Set `NEXT_PUBLIC_API_URL` to the deployed backend `/api` URL.
5. Keep preview deployments enabled for pull requests.
6. Do not store backend secrets in Vercel frontend env variables.

## Backend Automation Path

1. Connect the GitHub repository to Render, Railway, or Fly.io.
2. Set root directory to `backend` if the platform supports monorepo roots.
3. Use build command `npm install && npm run build`.
4. Use start command `npm start`.
5. Configure `MONGO_URI`, JWT secrets, `CLIENT_URL`, and optional provider keys in the platform dashboard.
6. Verify `/health` before connecting frontend production API URL.

## Database Automation Path

1. Create a MongoDB Atlas cluster manually.
2. Add database user and IP/network access rules.
3. Store the connection string in backend host secrets only.
4. Run seed only for demo data and only when the environment is intended for demo use.

## Promotion Flow

1. Merge to `main` only after CI passes.
2. Let Vercel/backend host deploy from `main`.
3. Run production smoke tests.
4. Update live URL docs only with real verified URLs.
5. Tag release after smoke tests pass.

## Blockers Requiring Manual Access

- GitHub Actions deployment secrets.
- Vercel project connection.
- Backend hosting dashboard access.
- MongoDB Atlas dashboard access.
- Real AI, Stripe, email, calendar, and monitoring provider credentials.
