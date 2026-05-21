# Project Storytelling Interview Answers

## What did you build?

I built AI Job Copilot, a job-seeker focused SaaS app that helps users upload a resume, analyze ATS readiness, discover matching jobs, tailor resumes, generate reviewable application materials, track applications, prepare for interviews, and improve after feedback.

## Why this project?

I wanted to build a product that solves a real workflow for freshers and entry-level developers while demonstrating full-stack, AI, SaaS, testing, deployment, and documentation skills.

## What was technically challenging?

Keeping the project broad but safe. I had to design AI provider fallback, user-reviewed application content, usage tracking, role-based admin, privacy/export/delete flows, and a verification workflow without pretending real providers or live production deployment were configured.

## How did you avoid unsafe AI behavior?

The product has explicit guardrails: no fake experience, no auto-apply, no auto-send, schema validation, mock fallback, usage tracking, and user review for generated content.

## What would you improve next?

I would deploy the backend and frontend, configure MongoDB Atlas, add real provider keys safely, install Playwright for active E2E, and improve resume parsing with dedicated PDF/DOCX parsers.
