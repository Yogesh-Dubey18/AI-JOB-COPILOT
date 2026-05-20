# AI Job Copilot Agent Guide

This repository is maintained by humans and AI coding agents. Follow these rules before editing.

## Resume Rule

Read `PHASE_PROGRESS.md` first. Continue from the last incomplete phase instead of restarting earlier phases.

## Safety Rules

- Do not commit real `.env` files.
- Do not print or hardcode secrets.
- Do not delete local `.env` files.
- Do not commit `node_modules`, `.next`, `dist`, `coverage`, logs, generated PDFs, or extension builds.
- Do not invent live URLs, users, customers, revenue, or production metrics.
- Do not auto-apply to jobs or auto-send recruiter messages.
- Keep provider-ready features labeled honestly when real credentials are absent.

## Verification

Run the relevant checks before committing:

```bash
npm run check:git-safety
npm run check:docs
npm run build
npm test
```

For major phase work, also run individual backend/frontend build and test commands.

## Commit Discipline

- Stage only files related to the current phase.
- Review `git diff --cached --stat` and `git diff --cached --name-only`.
- Use clear phase commit messages.
- Push only if a safe remote is configured.

## Documentation Style

- Be factual and fresher-friendly.
- Mark legal, billing, security, and commercial documents as templates where professional review is required.
- Keep future work issue-based after the final phase.

