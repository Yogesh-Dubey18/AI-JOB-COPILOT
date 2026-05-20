# Final Freeze Checklist

Use this checklist before treating the repository as a v1.0 portfolio demo release.

## Repository Freeze

- [ ] Worktree is clean before release tagging.
- [ ] `PHASE_PROGRESS.md` shows Phase 25 complete.
- [ ] README points to master index and handoff docs.
- [ ] `docs/README.md` includes all new release docs.
- [ ] `CHANGELOG.md` includes v1.0.0 notes.
- [ ] Package versions are `1.0.0`.

## Verification Gate

- [ ] `npm run check:git-safety`
- [ ] `npm run check:docs`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run build --prefix backend`
- [ ] `npm test --prefix backend`
- [ ] `npm run build --prefix frontend`
- [ ] `npm test --prefix frontend`

## Safety Gate

- [ ] Only `.env.example` files are tracked.
- [ ] No secrets, credentials, private keys, or real provider tokens.
- [ ] No `node_modules`, `.next`, `dist`, coverage, reports, logs, or generated PDFs.
- [ ] No fake live URLs or fake business metrics.
- [ ] Mock/provider-ready features are clearly labeled.

## Release Tag Gate

- [ ] Commit `Prepare v1.0 portfolio demo release` exists.
- [ ] Build/test/git safety passed after docs updates.
- [ ] Create local tag `v1.0.0`.
- [ ] Push tag only after a real Git remote is configured.

