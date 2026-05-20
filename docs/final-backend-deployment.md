# Final Backend Deployment

## Target Hosts

- Render.
- Railway.
- Fly.io.

## Backend Settings

- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health path: `/health`

## Required Env

- `NODE_ENV=production`
- `PORT`
- `CLIENT_URL`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Optional Env

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `REDIS_URL`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- Cloudinary values if file storage is enabled.

## Verification

```bash
GET https://your-backend.example.com/health
```

Expected safe response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "AI Job Copilot API"
  }
}
```
