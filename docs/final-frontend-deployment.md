# Final Frontend Deployment

## Target Host

- Vercel.

## Settings

- Root directory: `frontend`
- Build command: `npm run build`
- Output: Next.js default.

## Required Env

- `NEXT_PUBLIC_API_URL=https://your-backend.example.com/api`

## Verification

- Landing page loads.
- Login page loads.
- Dashboard redirects/protects correctly.
- Frontend calls backend API URL, not localhost.
- No secret values are exposed in frontend env.

## Notes

Only `NEXT_PUBLIC_*` variables are available to browser code. Never put backend secrets in frontend settings.
