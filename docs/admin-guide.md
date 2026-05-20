# Admin Guide

The admin panel is for operating a job-seeker SaaS, not for employer job posting.

## Current Admin Areas

- Users: inspect user accounts and onboarding health.
- Jobs: add, edit, delete, and review curated jobs.
- AI usage: monitor feature usage and future provider costs.
- Feedback: review user feedback.
- Reports: review scam-flagged jobs.

## Access

Admin routes require:

- Authenticated user.
- `role` set to `admin`.

## Operational Notes

- Review job sources before publishing jobs.
- Do not add protected scraped job listings.
- Do not impersonate users.
- Do not edit user resumes or messages without explicit consent.
- Convert feedback into issue-based improvements.
