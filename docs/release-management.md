# Release Management

## Release Types

- Patch: bug fixes, docs corrections, small safe UI tweaks.
- Minor: new workflow, new page, new provider-ready integration.
- Major: architecture changes, database migrations, billing enforcement, public launch.

## Pre-Release Checklist

- `npm run check:git-safety`
- `npm run build`
- `npm test`
- Backend build and tests.
- Frontend build and tests.
- Optional E2E if configured.
- Review `.env.example`.
- Review docs updates.
- Confirm no generated output is staged.

## Release Notes

Include:

- Summary.
- Features.
- Fixes.
- Known limitations.
- Manual setup steps.
- Migration notes.

## Rollback

- Keep previous deployment available when host supports it.
- Revert only the faulty commit or redeploy previous build.
- Never delete user data as a rollback shortcut.
