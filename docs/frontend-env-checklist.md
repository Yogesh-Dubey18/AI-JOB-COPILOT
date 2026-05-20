# Frontend Env Checklist

Set these in Vercel or the selected frontend host.

## Required

- `NEXT_PUBLIC_API_URL=https://your-backend-host.example.com/api`

## Rules

- Only expose browser-safe values with `NEXT_PUBLIC_`.
- Do not add JWT secrets, MongoDB URI, AI keys, email credentials, Stripe secret keys, or private provider credentials to the frontend.
- Update this value only after the backend health endpoint is verified.

## Checks

- Landing page loads.
- Login/register pages load.
- API calls hit the deployed backend URL.
- Browser console has no CORS errors.
- Dashboard, jobs, resume, applications, interviews, analytics, settings, and billing pages render.
