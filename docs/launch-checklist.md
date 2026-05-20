# Launch Checklist

This checklist is for a public demo or portfolio launch, not a claim of paid production readiness.

## Code

- Root build passes.
- Root tests pass.
- Backend build and tests pass.
- Frontend build and tests pass.
- Git safety check passes.
- No real `.env` files are tracked.
- No generated build output is tracked.

## Environment

- Backend production env values are set in the host dashboard.
- Frontend `NEXT_PUBLIC_API_URL` points to the backend `/api`.
- Backend `CLIENT_URL` points to the frontend origin.
- MongoDB Atlas URI is configured.
- JWT secrets are strong generated values.
- Optional AI/email/Cloudinary/Redis values are either configured or intentionally omitted.

## Product

- Demo data is seeded only when intended.
- AI fallback behavior is clearly explained.
- Billing is labeled mock/provider-ready.
- Legal pages are labeled templates requiring professional review.
- No live URL is documented until verified.

## Manual Demo

- Register user.
- Upload resume.
- Run analysis.
- View job match.
- Tailor resume.
- Generate application kit.
- Add application.
- Generate interview prep.
- Open analytics.
- Show admin dashboard as admin-only architecture.

## Stop Conditions

- Do not launch if auth fails.
- Do not launch if CORS blocks frontend calls.
- Do not launch if real secrets appear in Git.
- Do not launch if backend health is unavailable.
- Do not launch if MongoDB persistence is accidentally missing for a real-user demo.
