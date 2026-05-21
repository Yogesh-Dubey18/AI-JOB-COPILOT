# v2 Production Env Checklist

Use this checklist before deploying the v2 stable architecture release. Keep real values in hosting dashboards only. Do not commit secrets.

## Backend Required

- `NODE_ENV=production`
- `PORT` set by the host or explicitly configured.
- `CLIENT_URL=https://your-frontend-domain.example`
- `MONGO_URI` from MongoDB Atlas.
- `JWT_ACCESS_SECRET` with a strong random value.
- `JWT_REFRESH_SECRET` with a different strong random value.

## Backend Optional Provider Keys

- `AI_PROVIDER=mock|openai|gemini`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `AI_TIMEOUT_MS`
- `AI_RETRY_COUNT`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `REDIS_URL`
- `EMAIL_PROVIDER=mock|smtp|resend|sendgrid`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `SENTRY_DSN`

## Frontend Required

- `NEXT_PUBLIC_API_URL=https://your-backend-domain.example/api`

## Frontend Optional

- Public analytics or monitoring keys only when the provider is configured.
- Do not expose server-only API keys through `NEXT_PUBLIC_` variables.

## Verification

- Backend `/health` returns a safe status response.
- Backend CORS allows only the deployed frontend origin.
- Frontend build uses the production API base URL.
- MongoDB Atlas network access allows the backend host.
- JWT secrets are not reused between environments.
- Mock providers remain enabled only where real provider keys are unavailable.
