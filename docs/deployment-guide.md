# Deployment Guide

AI Job Copilot uses a split deployment model: Next.js frontend on Vercel, Express backend on Render/Railway/Fly.io, and MongoDB Atlas for persistence.

Do not commit real secrets or live URLs unless they are provided and verified. Keep `.env.example`, `backend/.env.example`, and `frontend/.env.example` placeholder-only.

## Frontend On Vercel

1. Import the Git repository in Vercel.
2. Set the project root directory to `frontend`.
3. Set install command to `npm install`.
4. Set build command to `npm run build`.
5. Keep output settings as the Vercel Next.js default.
6. Add environment variable:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-host.example.com/api
```

7. Deploy after the backend is reachable, then verify that pages using API data do not show network or CORS errors.

## Backend On Render

1. Create a new Web Service from the Git repository.
2. Set root directory to `backend`.
3. Set build command:

```bash
npm install && npm run build
```

4. Set start command:

```bash
npm start
```

5. Add backend environment variables from `backend/.env.example`.
6. Set `CLIENT_URL` to the verified Vercel frontend URL after frontend deployment.
7. Verify the health endpoint:

```bash
GET https://your-backend-host.example.com/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "AI Job Copilot API"
  }
}
```

## Backend On Railway

1. Create a Railway service from the repository.
2. Set the service root to `backend`.
3. Configure build command `npm install && npm run build`.
4. Configure start command `npm start`.
5. Add the same backend environment variables listed below.
6. Generate a public domain and use it as the backend base URL for `NEXT_PUBLIC_API_URL`.

## Backend On Fly.io

Fly.io is suitable when you want more control over regions and runtime configuration. Add a Dockerfile or Fly app config before using it for production. Until that is added, Render or Railway is the simpler deployment path.

## MongoDB Atlas Setup

1. Create a MongoDB Atlas project and cluster.
2. Create a database user with a strong generated password.
3. Restrict network access to deployment provider IPs where possible. During early demos, temporary broad access can work but should be tightened before public launch.
4. Copy the driver connection string.
5. Replace username, password, and database name locally in provider secrets only.
6. Set:

```bash
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

7. Run the backend seed command only when you intentionally want demo jobs:

```bash
npm run seed --prefix backend
```

## Backend Environment Variables

Required for production:

```bash
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-host.example.com
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
```

Optional/provider-ready:

```bash
OPENAI_API_KEY=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REDIS_URL=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
```

If AI keys are missing, structured mock AI responses are returned. If Redis is missing, queue setup falls back safely. If Cloudinary is missing, local upload fallback remains available.

## Frontend Environment Variables

Required for deployed frontend:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-host.example.com/api
```

Only expose values with the `NEXT_PUBLIC_` prefix when they are safe for browsers.

## CORS Checklist

- Backend `CLIENT_URL` must match the deployed frontend origin exactly.
- Frontend `NEXT_PUBLIC_API_URL` must point to the deployed backend `/api` base URL.
- Do not use `*` for credentialed production CORS.
- Confirm auth cookies are sent only over HTTPS in production.
- If the frontend has preview deployments, add only the preview origins you explicitly trust.
- If a browser shows a CORS error, compare the request `Origin` header with backend `CLIENT_URL`.
- Keep local `CLIENT_URL=http://localhost:3000` only for local development.

## Verification Commands

Run locally before deployment:

```bash
npm run check:git-safety
npm run build
npm test
npm run build --prefix backend
npm test --prefix backend
npm run build --prefix frontend
npm test --prefix frontend
```

Run after deployment:

```bash
curl https://your-backend-host.example.com/health
```

Then open the frontend and manually test registration, login, resume upload, job matching, application tracker, interview prep, and analytics.

## Troubleshooting

- Backend health fails: check build logs, `NODE_ENV`, `PORT`, and start command.
- API calls fail from frontend: check `NEXT_PUBLIC_API_URL` and backend `CLIENT_URL`.
- Database data disappears: confirm `MONGO_URI` is configured and the backend is not using in-memory fallback.
- AI output is mock: add a valid Gemini or OpenAI API key in backend secrets.
- Uploads are local-only: add Cloudinary credentials or ensure host disk behavior is acceptable for demos.
