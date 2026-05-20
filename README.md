# AI Job Copilot

Upload your resume once. Get matching jobs, tailored resumes, application help, and interview preparation until selection.

AI Job Copilot is a job-seeker focused AI SaaS platform. It is not an employer job-posting board and it does not auto-apply. It helps candidates analyze resumes, match jobs, create reviewable application content, track applications, prepare for interviews, learn missing skills, detect scams, and improve after rejection.

## Monorepo

- `frontend`: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-compatible components, TanStack Query, React Hook Form, Zod, Recharts, Framer Motion, Lucide, dark mode, PWA-ready public manifest.
- `backend`: Express.js, TypeScript, MongoDB/Mongoose models, JWT access token, refresh token httpOnly cookies, bcrypt, Multer, optional Cloudinary, optional Redis/BullMQ fallback, AI provider integration with mock fallback.
- `shared`: Shared TypeScript types and Zod schemas.
- `docs`: API, database, setup, roadmap, and deployment documentation.

## Local Setup

~~~bash
npm install
npm run install:all
npm run seed --prefix backend
npm run dev
~~~

Frontend: http://localhost:3000
Backend: http://localhost:5000

## Useful Commands

~~~bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
npm run build --prefix frontend
npm run build --prefix backend
npm test
npm test --prefix frontend
npm test --prefix backend
npm run seed --prefix backend
~~~

## Environment

Copy `.env.example`, `frontend/.env.example`, and `backend/.env.example`. Add MongoDB Atlas URI and JWT secrets for production. AI keys are optional because the app has structured mock fallback responses.

## Deployment Readiness

AI Job Copilot is structured for split deployment:

- Frontend: Vercel, root directory `frontend`, build command `npm run build`.
- Backend: Render, Railway, or Fly.io, root directory `backend`, build command `npm install && npm run build`, start command `npm start`.
- Database: MongoDB Atlas via `MONGO_URI`.

Production environment variables are documented in [Deployment Guide](docs/deployment-guide.md), [Production Checklist](docs/production-checklist.md), and [Security Checklist](docs/security-checklist.md). Do not add real keys to the repo. Use provider dashboards for secrets.

Backend health check:

~~~bash
GET https://your-backend-host.example.com/health
~~~

Expected safe response:

~~~json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "AI Job Copilot API"
  }
}
~~~

Frontend API configuration:

~~~bash
NEXT_PUBLIC_API_URL=https://your-backend-host.example.com/api
~~~

No live URLs are committed until they are provided and verified.
