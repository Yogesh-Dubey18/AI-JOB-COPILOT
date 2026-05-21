# Branch Protection Guide

Use branch protection after the repository is connected to GitHub Actions.

## Recommended Rule For `main`

- Require pull request before merging.
- Require at least one approval for collaborative work.
- Require status checks to pass before merge.
- Require branches to be up to date before merge when collaboration increases.
- Block force pushes.
- Block branch deletion.
- Require conversation resolution before merge.

## Required Checks

Start with these checks:

- `Build, Test, and Safety Checks`
- `Repository Safety`

Add `Frontend E2E Smoke` as required only after Playwright is installed and stable in CI.

## Merge Policy

- Prefer squash merge for small feature branches.
- Use merge commits only when preserving detailed branch history matters.
- Do not merge provider credential changes unless secrets are configured outside git.
- Do not merge docs that claim live deployment until URLs are verified.

## Emergency Changes

If production is live later:

- Keep a small hotfix branch.
- Run at least git safety, security safety, build, and affected tests.
- Document the hotfix in `CHANGELOG.md`.
- Follow with a normal PR cleanup if any test was skipped.
