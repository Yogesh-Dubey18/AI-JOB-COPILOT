# Security Checklist

This is an engineering checklist, not legal or compliance advice.

## Secrets

- Do not commit `.env`, `backend/.env`, `frontend/.env`, `.env.local`, keys, certificates, or provider credentials.
- Keep real secrets in Vercel, Render, Railway, Fly.io, MongoDB Atlas, or the selected provider secret store.
- Rotate any secret that was accidentally exposed.
- Use long random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

## Authentication

- Passwords are hashed with bcrypt.
- JWT access tokens are short-lived.
- Refresh tokens are stored in httpOnly cookies.
- Authenticated routes use the auth middleware.
- Admin routes require the admin role.
- Failed auth responses do not reveal whether an email exists.

## HTTP And Browser Security

- Helmet is enabled.
- CORS allows only the configured frontend origin in production.
- Do not use wildcard CORS with cookies.
- Production deployments must use HTTPS.
- Browser-exposed environment variables must be limited to safe `NEXT_PUBLIC_` values.

## Input And File Safety

- Backend requests are validated with Zod validators where applicable.
- Resume upload accepts only allowed file types.
- Resume file size is limited.
- Uploaded files are stored locally only for fallback/demo usage unless Cloudinary is configured.
- Do not parse or execute uploaded content as code.

## AI Safety

- AI output is advisory and user-reviewed.
- The system must not invent experience, companies, education, or credentials.
- The system must not auto-apply to jobs.
- The system must not auto-send LinkedIn, WhatsApp, HR email, or referral messages.
- AI provider keys stay backend-only.
- AI request usage is tracked where possible.

## Data Isolation

- User-owned records must be queried by `userId`.
- Admin-only views must be protected.
- Logs should avoid resume text, tokens, credentials, and personal documents.
- Data export/delete workflows are future-ready and should be completed before real production use.

## Deployment Review

- Run `npm run check:git-safety`.
- Run build and test commands from the root, backend, and frontend.
- Verify `/health` returns only safe service status.
- Check provider logs for stack traces, secret leakage, and CORS errors.
- Review MongoDB Atlas network and database user permissions.

## Known Security Work Remaining

- Add automated dependency/security scanning.
- Add request IDs and structured production logging.
- Add account deletion/export flows.
- Add formal incident response and retention policies.
- Add provider-backed monitoring and alerting.

## V2 Beta Security Status

| Area | Status | Notes |
|------|--------|-------|
| Auth (bcrypt + JWT) | ✅ Implemented | 12-round bcrypt, 7-day JWT |
| Secrets management | ✅ Clean | `check:security` passes |
| CORS | ✅ Configured | Restricted to frontend origin |
| Input validation | ⚠️ Partial | Zod on key routes; expand coverage |
| Rate limiting | ⚠️ Missing | Add before public launch |
| File upload MIME check | ⚠️ Partial | Extension checked; MIME not |
| Dependency audit | ⚠️ Not run | Run `npm audit` before launch |
| AI safety rules | ✅ Enforced | No auto-apply, no invented content |
| Data isolation (userId) | ✅ Implemented | All user data filtered by userId |
| HTTPS | ✅ Enforced | Vercel + Render enforce HTTPS |
