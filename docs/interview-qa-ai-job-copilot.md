# Interview Q&A: AI Job Copilot

## What problem does it solve?

It helps job seekers run a structured application process instead of applying randomly with one generic resume.

## Why not auto-apply?

Auto-applying can be unsafe and low quality. The product keeps resume changes, cover letters, and recruiter messages user-reviewed.

## How does AI work without API keys?

The backend has a provider abstraction. If OpenAI or Gemini keys are missing, it returns structured mock responses so the product remains runnable locally.

## How is data stored?

The backend uses Mongoose models for MongoDB and a repository abstraction with local in-memory fallback for demos and tests.

## What was the hardest part?

Keeping the scope broad but coherent: auth, resume, jobs, AI, tracker, interviews, analytics, admin, billing-ready architecture, testing, and docs all had to work together.

## What would you improve next?

Real PDF exports, stronger PDF/DOCX parsing, Playwright E2E, Stripe webhooks, structured logging, account data export/delete, and live deployment monitoring.
