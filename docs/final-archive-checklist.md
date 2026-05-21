# Final Archive Checklist

Use this checklist before treating the repository as an archive-ready handoff.

## Repository Safety

- [ ] `git status --short` is reviewed.
- [ ] Only intended source and documentation files are staged.
- [ ] No real `.env` files are tracked.
- [ ] No `node_modules`, `.next`, `dist`, `coverage`, Playwright reports, generated PDFs, private keys, credentials, or service accounts are tracked.
- [ ] `.env.example` files contain placeholders only.
- [ ] No fake live URLs, customers, metrics, revenue, funding, partnerships, or platform access claims are added.

## Verification

- [ ] `npm run check:git-safety`
- [ ] `npm run check:security`
- [ ] `npm run check:docs`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run build --prefix backend`
- [ ] `npm test --prefix backend`
- [ ] `npm run build --prefix frontend`
- [ ] `npm test --prefix frontend`
- [ ] `npm run build --prefix extension`
- [ ] `npm test --prefix extension`
- [ ] `npm run test:e2e --prefix frontend`
- [ ] `npm run typecheck`
- [ ] `npm run lint`

## Release Artifacts

- [ ] `README.md` points to the final navigation files.
- [ ] `docs/README.md` links to the archive and handoff docs.
- [ ] `CHANGELOG.md` records the final archive package.
- [ ] `PHASE_PROGRESS.md` records Phase 50.
- [ ] `START_HERE.md` tells the next maintainer where to begin.
- [ ] Final archive tag is created only after all checks pass.

## Manual Items Not Solved By Git

- [ ] Production hosting accounts are configured.
- [ ] MongoDB Atlas is configured.
- [ ] Provider secrets are stored in platform dashboards.
- [ ] Live URLs are verified and then documented.
- [ ] Legal/commercial docs are reviewed by qualified professionals before paid public launch.
- [ ] Real user feedback is converted into issues, not new broad phases.
