# AI Job Copilot Project Interview Q&A

## Why Did You Build This?

I built it to solve a real job-seeker workflow: resume improvement, job matching, tailored applications, interview prep, and tracking. It also demonstrates full-stack SaaS architecture.

## What Was The Hardest Part?

Designing the product as a complete system rather than one isolated feature. The app needed auth, resume workflows, AI fallback, jobs, applications, interviews, analytics, admin, docs, and safe deployment behavior.

## How Does AI Work?

The backend has an AI service abstraction. If real provider keys are configured, it can call Gemini/OpenAI style providers. If keys are missing, it returns structured mock outputs so local development and demos still work.

## How Did You Handle Security?

The project uses environment variables, placeholder-only `.env.example` files, JWT auth architecture, password hashing, rate limiting, CORS, Helmet, validation, safe errors, and git safety checks.

## What Would You Improve Next?

I would improve real resume parsing, add production job-source integrations, strengthen E2E coverage, add real PDF exports, and deploy with monitoring.
