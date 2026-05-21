# v2 Production Deployment Verification

This document records the checks required before calling a deployment live. No public URLs are verified until real `FRONTEND_LIVE_URL`, `BACKEND_LIVE_URL`, and `BACKEND_HEALTH_URL` values are provided.

## Preflight

- Root verification passes locally.
- Git safety check passes.
- Security safety check passes.
- `.env.example` files are placeholders only.
- No generated PDFs, uploads, build outputs, reports, credentials, or private keys are tracked.

## Backend Verification

- Deploy backend from `backend`.
- Set build command to `npm install && npm run build`.
- Set start command to `npm start`.
- Configure backend environment variables from [v2 Production Env Checklist](v2-production-env-checklist.md).
- Confirm `/health` returns:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "AI Job Copilot API"
  }
}
```

## Frontend Verification

- Deploy frontend from `frontend`.
- Set `NEXT_PUBLIC_API_URL` to the deployed backend `/api` URL.
- Confirm login/register pages load.
- Confirm protected pages redirect when unauthenticated.
- Confirm public pages render without console-breaking runtime errors.

## Data Verification

- Confirm MongoDB Atlas connection succeeds.
- Confirm sample seed data is optional and never required for production login.
- Confirm user data isolation still uses authenticated `userId` scoping.

## Provider Verification

- With no AI keys, mock fallback responses are returned.
- With AI keys, provider calls time out and retry according to env settings.
- Email remains mock unless SMTP or provider credentials are configured.
- Billing remains mock/Stripe-ready unless Stripe keys and webhooks are configured.

## Result

Current status: pending live deployment URLs and dashboard access.

Do not replace placeholders with guessed URLs. Update this file only after actual deployed URLs are provided and tested.
