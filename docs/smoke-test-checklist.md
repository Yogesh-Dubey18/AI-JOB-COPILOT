# Smoke Test Checklist

Run this after every deployment or major local change.

## Backend

- `GET /health` returns 200 and safe service status.
- `POST /api/auth/register` creates a user.
- `POST /api/auth/login` returns access token and httpOnly refresh cookie.
- `GET /api/auth/me` is protected.
- `PUT /api/profile` saves profile data.
- `POST /api/resumes/upload` accepts TXT/PDF/DOCX within limits.
- `POST /api/resumes/:id/analyze` returns ATS analysis.
- `GET /api/jobs` returns jobs.
- `POST /api/jobs/:id/match` returns match score.
- `POST /api/applications` creates an application.
- `POST /api/ai/interview-prep` returns fallback or provider output.

## Frontend

- Landing page renders.
- Login and register pages render.
- Dashboard renders after auth.
- Onboarding form advances through all steps.
- Resume upload page accepts a file.
- Resume analyzer displays score sections.
- Jobs page shows cards.
- Job detail page shows AI adviser sections.
- Application tracker renders.
- Interview mock page renders.
- Analytics dashboard renders charts.
- Settings and billing pages render.

## Production URLs

Use real URLs only after deployment:

- Frontend: `https://your-frontend-host.example.com`
- Backend: `https://your-backend-host.example.com`
- Health: `https://your-backend-host.example.com/health`

## Pass Criteria

- No secret values appear in UI, logs, or source.
- No generated artifacts are tracked.
- Core auth, resume, jobs, applications, AI fallback, and analytics flows work.
