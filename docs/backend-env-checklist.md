# Backend Env Checklist

Set these in the backend host dashboard. Do not commit real values.

## Required

- `NODE_ENV=production`
- `PORT=5000` or provider-managed port
- `CLIENT_URL=https://your-frontend-host.example.com`
- `MONGO_URI=mongodb+srv://...`
- `JWT_ACCESS_SECRET=<generated-secret>`
- `JWT_REFRESH_SECRET=<generated-secret>`
- `STORAGE_SIGNING_SECRET=<unique-32+-character-random-secret>`

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
- `STORAGE_PROVIDER=local|s3|r2|cloudinary`
- `STORAGE_BUCKET_NAME=` required for S3/R2
- `STORAGE_REGION=` S3 region or configured R2 region
- `STORAGE_ENDPOINT=` required for R2
- `STORAGE_ACCESS_KEY_ID=` backend only
- `STORAGE_SECRET_ACCESS_KEY=` backend only
- `STORAGE_SIGNED_URL_TTL_SECONDS=900`
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
