# CI/CD v2

AI Job Copilot uses GitHub Actions to verify the repository before merge, before release tags, and during scheduled security safety checks.

## Workflows

- `.github/workflows/ci.yml`: runs on pull requests and pushes to `main`.
- `.github/workflows/e2e.yml`: runs manually and on frontend pull requests; it uses the skip-safe E2E command until Playwright is installed.
- `.github/workflows/security.yml`: runs safety checks on pull requests, pushes to `main`, and a weekly schedule.
- `.github/workflows/release-validation.yml`: runs full release validation for tags and manual release checks.

## Required Local Commands

Run these before opening or merging a pull request:

~~~bash
npm run check:git-safety
npm run check:security
npm run check:docs
npm run build
npm test
npm run test:e2e --prefix frontend
~~~

## Node Version

The repo pins Node 20 through `.nvmrc`. GitHub Actions reads this file with `actions/setup-node`.

## CI Expectations

- CI must not require real provider credentials.
- AI, billing, email, calendar, and deployment checks must remain mock-safe.
- Workflows must not print secrets.
- Build outputs, coverage, Playwright reports, and generated PDFs remain ignored.
- `npm audit` in the security workflow is advisory and does not auto-fix dependencies.

## Future Enhancements

- Install Playwright and browser binaries in CI after approving the dependency.
- Add coverage thresholds after stable test coverage grows.
- Add deployment jobs only after Vercel/Render/Railway secrets are configured in GitHub.
- Add status badges for any future workflows only after the workflow file exists.
