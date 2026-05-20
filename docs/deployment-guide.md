# Deployment Guide

## Frontend on Vercel

1. Import the repo.
2. Set root directory to `frontend`.
3. Add `NEXT_PUBLIC_API_URL=https://your-backend.example.com/api`.
4. Build command: `npm run build`.

## Backend on Render/Railway/Fly.io

1. Set root directory to `backend`.
2. Build command: `npm install && npm run build`.
3. Start command: `npm start`.
4. Add MongoDB Atlas URI, JWT secrets, client URL, optional Redis, Cloudinary, email, and AI keys.

## MongoDB Atlas

Create a cluster, whitelist the backend host, create a database user, and set `MONGO_URI`.

## Troubleshooting

- Missing AI key: app returns structured mock output.
- Missing Redis: BullMQ queues use safe fallback.
- Missing Cloudinary: local upload storage remains active.
