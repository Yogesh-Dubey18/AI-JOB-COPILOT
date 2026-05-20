# Project Operating Manual

AI Job Copilot is maintained as a safe, demo-ready full-stack SaaS project. This manual explains how to operate the repository without breaking trust or overclaiming readiness.

## Operating Principles

- Keep the app runnable locally.
- Keep secrets out of Git.
- Keep mock fallbacks working when provider keys are missing.
- Verify before committing.
- Document manual actions instead of pretending external work is complete.
- Treat AI outputs as suggestions that require user review.

## Daily Work Loop

1. Check `git status --short`.
2. Read `PHASE_PROGRESS.md` before continuing phase work.
3. Make focused changes.
4. Run relevant build/test/docs/safety checks.
5. Update docs and progress notes.
6. Commit only source/docs/config files that are safe to track.

## Standard Verification

```bash
npm run check:git-safety
npm run check:docs
npm run build
npm test
npm run build --prefix backend
npm test --prefix backend
npm run build --prefix frontend
npm test --prefix frontend
```

Optional checks should be run when scripts exist:

```bash
npm run check:security --if-present
npm run typecheck --if-present
npm run lint --if-present
npm run test:e2e --prefix frontend --if-present
```

## Release Discipline

- Tag releases only after build, test, docs, and git safety pass.
- Keep changelog entries factual.
- Do not tag if the worktree contains unexpected changes.
- Do not publish live URLs until they are real and verified.

## External Dependencies

The following require owner setup outside the repo:

- MongoDB Atlas project and URI.
- Backend hosting project.
- Frontend hosting project.
- AI provider keys.
- Email provider credentials.
- Billing provider credentials.
- Monitoring provider credentials.
- Real domain and DNS settings.

