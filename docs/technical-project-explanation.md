# Technical Project Explanation

## Architecture

AI Job Copilot is a monorepo with a Next.js frontend, Express TypeScript backend, and shared TypeScript package.

## Frontend

The frontend uses Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, and reusable UI components. It includes public pages, auth pages, dashboard, onboarding, resume workflows, jobs, applications, interviews, analytics, settings, billing, notifications, and admin pages.

## Backend

The backend uses Express.js, TypeScript, JWT auth, refresh-token cookie architecture, Mongoose models, Zod validation, Multer uploads, rate limiting, Helmet, CORS, and service-based modules.

## AI

AI features use a provider abstraction. If Gemini or OpenAI keys are missing, the backend returns structured mock fallback outputs. This keeps the app runnable locally and avoids fake provider success claims.

## Database

The app defines models for users, profiles, resumes, resume analysis, resume versions, jobs, job matches, tailored resumes, application kits, applications, interviews, mock interviews, learning plans, portfolios, scam reports, chat sessions, notifications, analytics snapshots, AI requests, and feedback.

## Security

The app includes bcrypt hashing, JWT auth, httpOnly refresh cookie flow, route protection, admin guard, rate limiting, Helmet, CORS, validation, file type/size limits, safe error handling, and Git safety checks.

## Testing

Backend tests cover auth, profile, resume upload/analysis fallback, jobs, matching, tailoring, applications, and interview prep fallback. Frontend tests cover key page rendering.
