# Backend Env Checklist

Set these in the backend host dashboard. Do not commit real values.

## Required

- `NODE_ENV=production`
- `PORT=5000` or provider-managed port
- `CLIENT_URL=https://your-frontend-host.example.com`
- `MONGO_URI=mongodb+srv://...`
- `JWT_ACCESS_SECRET=<generated-secret>`
- `JWT_REFRESH_SECRET=<generated-secret>`

## AI

- `AI_PROVIDER=auto`
- `AI_MODEL=`
- `AI_TIMEOUT_MS=12000`
- `AI_RETRY_ATTEMPTS=1`
- `OPENAI_API_KEY=` optional
- `GEMINI_API_KEY=` optional

## Optional Services

- `CLOUDINARY_CLOUD_NAME=`
- `CLOUDINARY_API_KEY=`
- `CLOUDINARY_API_SECRET=`
- `REDIS_URL=`
- `EMAIL_HOST=`
- `EMAIL_PORT=`
- `EMAIL_USER=`
- `EMAIL_PASS=`
- `EMAIL_FROM=`
- `LOG_LEVEL=info`

## Checks

- Backend boots without printing secrets.
- `/health` returns safe 200 response.
- Auth cookies work over HTTPS.
- CORS allows the frontend and rejects untrusted origins.
