# API Contract

Base URL: `/api`

Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`

Profile: `GET /profile`, `PUT /profile`, `POST /profile/skills`, `DELETE /profile/skills/:skill`

Resume: `POST /resumes/upload`, `GET /resumes`, `GET /resumes/:id`, `POST /resumes/:id/analyze`, `POST /resumes/:id/improve`, `POST /resumes/:id/export-pdf`, `GET /resumes/versions`, `GET /resumes/versions/:id`

Storage: `GET /storage/download?key=...&ownerId=...&expiresAt=...&signature=...` streams local, S3/R2, or Cloudinary objects after checking a short-lived owner-bound HMAC and current owning-record/visibility policy. Treat the URL as a temporary bearer capability; do not log or persist its signature. Production requires backend-only `STORAGE_SIGNING_SECRET` (at least 32 random characters); provider credentials and storage-origin URLs are never sent to browser clients.

Jobs: `GET /jobs`, `GET /jobs/:id`, `GET /jobs/recommended`, `GET /jobs/daily-feed`, `POST /jobs/:id/save`, `POST /jobs/:id/match`, `POST /jobs/:id/tailor-resume`

Applications, interviews, AI, analytics, notifications, and admin routes are implemented in `backend/src/routes`.
