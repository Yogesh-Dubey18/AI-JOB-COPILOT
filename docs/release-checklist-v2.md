# Release Checklist v2

Use this checklist before creating v2 tags or public demo release notes.

## Code Verification

- [ ] `npm run check:git-safety`
- [ ] `npm run check:security`
- [ ] `npm run check:docs`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run build --prefix backend`
- [ ] `npm test --prefix backend`
- [ ] `npm run build --prefix frontend`
- [ ] `npm test --prefix frontend`
- [ ] `npm run test:e2e --prefix frontend`
- [ ] `npm run typecheck`
- [ ] `npm run lint`

## Repository Safety

- [ ] Only `.env.example` files are tracked.
- [ ] No `node_modules`, `.next`, `dist`, `coverage`, Playwright reports, generated PDFs, exports, credentials, private keys, or build artifacts are tracked.
- [ ] README and docs do not include fake live URLs or fake metrics.
- [ ] Provider-ready features are labelled honestly.

## Deployment Readiness

- [ ] Backend health endpoint returns a small secret-free response.
- [ ] Frontend `NEXT_PUBLIC_API_URL` points to the verified backend API for deployment.
- [ ] `CLIENT_URL` allows the deployed frontend origin.
- [ ] MongoDB Atlas connection is configured in backend host only.
- [ ] AI, email, billing, calendar, and monitoring providers remain optional unless keys are configured.

## Release Notes

- [ ] `CHANGELOG.md` updated.
- [ ] Known limitations updated.
- [ ] Smoke test report updated.
- [ ] Manual setup requirements listed.
- [ ] Tags pushed only after verification passes.
