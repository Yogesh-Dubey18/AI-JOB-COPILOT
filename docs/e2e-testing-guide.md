# E2E Testing Guide

The frontend includes a Playwright-ready E2E foundation in `frontend/e2e`.

## Current Local Behavior

`@playwright/test` is not currently installed. To keep the repo runnable without network installs, the E2E script checks for the package and exits successfully with a skip message when it is absent.

Run:

```bash
npm run test:e2e --prefix frontend
```

Expected current output:

```text
Playwright is not installed. Skipping E2E tests; install @playwright/test to enable them.
```

## Enabling Playwright Later

When network access is available:

```bash
npm install -D @playwright/test --prefix frontend
npx playwright install
npm run test:e2e --prefix frontend
```

Do not commit Playwright reports, browser downloads, traces, screenshots, or test results.

## Smoke Coverage

The current smoke spec covers:

- landing page render
- pricing page render
- protected dashboard redirect to login
- protected admin page redirect to login

## Future E2E Scope

- authenticated onboarding
- resume upload with text fixture
- AI analyzer fallback flow
- job match and tailor resume flow
- application tracker status update
- admin system health page
- billing mock activation
