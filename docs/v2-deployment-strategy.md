# v2 Deployment Strategy

## Environments

- Local development.
- Preview deployment.
- Production demo.

## Frontend

- Vercel project.
- `NEXT_PUBLIC_API_URL` points to backend `/api`.
- Preview deploys for PR branches when repository is hosted.

## Backend

- Render/Railway/Fly service.
- Build: `npm install && npm run build`.
- Start: `npm start`.
- Health check: `/health`.

## Database

- MongoDB Atlas.
- Separate development and production databases.
- Connection string stored only in platform env.

## Release Checklist

- Env variables configured.
- CORS frontend URL configured.
- Health endpoint passes.
- Smoke test passes.
