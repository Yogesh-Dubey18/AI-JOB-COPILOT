# Performance Improvement Guide

## Frontend

- Keep heavy charts lazy where possible.
- Add skeleton and empty states for slow data.
- Avoid unnecessary client components.
- Use pagination for jobs and applications.
- Keep tables mobile-friendly.
- Check bundle size after large dependencies.

## Backend

- Add indexes for filtered fields.
- Paginate list endpoints.
- Cache repeated AI outputs.
- Move expensive AI work to queues.
- Add timeouts to provider calls.
- Keep uploads size-limited.

## Database

- Index user-owned data by `userId`.
- Index job filters such as role, location, skills, and posted date.
- Avoid unbounded queries.

## Review Cadence

- Before release.
- After new analytics-heavy pages.
- After adding provider integrations.
- After user reports of slowness.
