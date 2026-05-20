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
