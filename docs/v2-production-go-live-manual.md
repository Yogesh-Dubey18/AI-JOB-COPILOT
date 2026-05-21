# v2 Production Go-Live Manual

This manual is the safe order for launching AI Job Copilot v2 after source verification passes.

## 1. Prepare Accounts

- MongoDB Atlas project and database user.
- Backend host such as Render, Railway, or Fly.io.
- Vercel project for frontend.
- Optional provider dashboards for AI, email, billing, monitoring, storage, and Redis.

## 2. Configure Backend

- Deploy from `backend`.
- Add environment variables from [v2 Production Env Checklist](v2-production-env-checklist.md).
- Configure `CLIENT_URL` with the exact frontend URL.
- Keep `AI_PROVIDER=mock` until a real provider key is added and tested.
- Confirm `/health` works before connecting the frontend.

## 3. Configure Frontend

- Deploy from `frontend`.
- Add `NEXT_PUBLIC_API_URL=https://your-backend-domain.example/api`.
- Rebuild after changing the API URL.
- Confirm auth pages, dashboard redirects, and public pages load.

## 4. Configure Data

- Add MongoDB Atlas network access for the backend host.
- Run seed only for demo/staging data, not for a real user database unless intentionally planned.
- Verify user registration creates isolated user-owned records.

## 5. Verify Core Flows

- Register a test user.
- Complete onboarding.
- Upload a safe sample TXT resume.
- Run ATS analysis with mock or provider AI.
- View jobs and run match.
- Generate application kit.
- Track an application.
- Generate interview prep.
- View analytics.
- Export privacy data.

## 6. Public Demo Safety

- Keep seeded/demo accounts separate from personal accounts.
- Do not show real secrets, tokens, private resumes, or private application history.
- Do not claim automatic applications or guaranteed job outcomes.
- Keep legal/commercial pages labelled as templates until professionally reviewed.

## 7. Launch Decision

Launch only when:

- [v2 Production Deployment Verification](v2-production-deployment-verification.md) is complete.
- [v2 Production Smoke Test Report](v2-production-smoke-test-report.md) has real pass/fail notes.
- README live URL placeholders are replaced only with verified URLs.
- CORS and frontend API URL match the deployed domains.
