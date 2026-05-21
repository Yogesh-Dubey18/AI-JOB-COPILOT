# v2 Stable Release Closure

## Release

- Version: `v2.0.0`
- Release type: stable source, documentation, and architecture release.
- Production status: deployment-ready runbooks complete; live deployment pending external platform setup.

## Completed

- v2 beta documentation was consolidated into stable release guidance.
- Production environment checklist was added.
- Deployment verification procedure was added.
- Production smoke test report template was added.
- Go-live manual was added.
- README, CHANGELOG, final audit, known limitations, and docs index were updated.

## Verification Gate

Before tagging this release, run:

```bash
npm run check:git-safety
npm run check:security
npm run check:docs
npm run build
npm test
npm run build --prefix backend
npm test --prefix backend
npm run build --prefix frontend
npm test --prefix frontend
npm run build --prefix extension
npm test --prefix extension
npm run test:e2e --prefix frontend
npm run typecheck
npm run lint
```

## Manual Release Notes

- Do not claim a hosted production launch until live URLs are verified.
- Keep all provider keys out of the repository.
- Use mock providers for demos where real credentials are not available.
- Update [v2 Production Smoke Test Report](v2-production-smoke-test-report.md) only with real tested URLs.
