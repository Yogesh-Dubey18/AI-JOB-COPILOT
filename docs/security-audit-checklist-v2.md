# Security Audit Checklist v2

Use this checklist before public demos, deployments, and release tags.

## Repository Safety

- Run `npm run check:git-safety`.
- Run `npm run check:security`.
- Confirm only `.env.example` files are tracked.
- Confirm no build outputs, PDFs, credentials, keys, or reports are tracked.

## Auth

- Password policy tests pass.
- Account lock behavior works after repeated failed logins.
- Access and refresh token type checks are active.
- Refresh tokens are stored as hashes.
- Admin routes require the `admin` role.

## API Security

- Helmet is enabled.
- CORS only allows configured frontend origins.
- Auth and AI rate limits are enabled outside tests.
- Zod validation protects auth, profile, and AI inputs.
- Safe error responses avoid secret leakage.

## Data Privacy

- Audit logs do not store request bodies.
- Resume content is not printed in logs.
- Provider keys never appear in frontend code.
- AI prompts redact common secret-like values.

## Production Readiness

- Production JWT secrets are strong.
- MongoDB Atlas connection uses least-privilege credentials.
- Live URLs are real before docs are updated.
- Stripe/email/calendar/provider keys are configured only in deployment dashboards.
- Legal and privacy documents are reviewed before commercial launch.
