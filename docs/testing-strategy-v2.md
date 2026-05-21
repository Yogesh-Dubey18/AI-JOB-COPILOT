# Testing Strategy v2

AI Job Copilot v2 uses layered tests so local development stays fast while production flows can be verified before release.

## Current Automated Coverage

- Backend API integration tests with Vitest and Supertest.
- Frontend page smoke tests with Vitest, Testing Library, and jsdom.
- Root build and test scripts that verify shared, backend, and frontend packages.
- Git safety, documentation link, and security safety checks.

## Backend Focus

Backend tests cover:

- registration and login
- password policy and lockout
- auth middleware
- profile update
- resume upload and analysis fallback
- job listing, matching, import, and tailoring
- applications and notification reminders
- AI fallback, usage, and limits
- billing mock subscriptions
- admin guard and operations endpoints

## Frontend Focus

Frontend tests cover:

- auth pages
- dashboard
- resume upload and analyzer
- jobs and job detail
- application tracker
- interview tracker
- analytics
- notifications
- billing settings
- admin dashboard

## E2E Foundation

Playwright specs are scaffolded in `frontend/e2e`. The repo does not currently install `@playwright/test`, so `npm run test:e2e --prefix frontend` skips safely until the dependency is added.

When Playwright is installed, the smoke suite checks:

- public landing and pricing pages
- protected dashboard redirect
- protected admin page redirect

## Release Verification

Before a release, run:

```bash
npm run check:git-safety
npm run check:security
npm run check:docs
npm run build
npm test
npm run test:e2e --prefix frontend
```

E2E should be treated as optional until Playwright is installed and browsers are available in the environment.
