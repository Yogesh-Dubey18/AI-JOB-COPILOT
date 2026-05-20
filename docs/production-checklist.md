# Production Checklist

Use this checklist before any public demo or production deployment.

## Repository

- `npm run check:git-safety` passes.
- Only `.env.example` files are tracked.
- No `node_modules`, `.next`, `dist`, `coverage`, reports, generated PDFs, uploads, or credentials are tracked.
- README and deployment docs use placeholders unless real URLs are provided and verified.
- `PHASE_PROGRESS.md` is current.

## Backend

- `npm run build --prefix backend` passes.
- `npm test --prefix backend` passes.
- `backend/package.json` has `build` and `start` scripts.
- `NODE_ENV=production` is set on the host.
- `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are configured in provider secrets.
- `CLIENT_URL` exactly matches the deployed frontend origin.
- `/health` returns a safe 200 response.
- Logs do not print secrets.

## Frontend

- `npm run build --prefix frontend` passes.
- `npm test --prefix frontend` passes.
- `NEXT_PUBLIC_API_URL` points to the backend `/api` URL.
- Auth pages, dashboard, jobs, resume upload, application tracker, interviews, and analytics render.
- Mobile layout is checked for the core flows.

## Database

- MongoDB Atlas cluster is created.
- Database user uses a generated password stored only in deployment secrets.
- Network access is restricted as much as the deployment provider allows.
- Demo seed data is added only when intentionally needed.
- Backups and retention settings are reviewed before real users.

## AI And Providers

- Missing AI keys are acceptable for demos because mock fallback is implemented.
- Real `OPENAI_API_KEY` or `GEMINI_API_KEY` is added only in backend secrets.
- AI-generated resume/application content remains user-review based.
- The app does not auto-apply or auto-send recruiter messages.

## Launch Smoke Test

- Register a user.
- Log in.
- Complete onboarding.
- Upload a resume.
- Run resume analysis.
- View jobs and match a job.
- Tailor a resume.
- Generate an application kit.
- Create and update an application.
- Generate interview prep.
- Open analytics.

## Manual Values Needed

- Frontend live URL.
- Backend live URL.
- Backend health URL.
- MongoDB Atlas connection string.
- Deployment provider access.
- Optional AI, email, Redis, and Cloudinary credentials.
