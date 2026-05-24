# Release Checklist — v2.0.0-beta

Follow this checklist to verify the stability, safety, and correctness of the codebase before tagging a release.

---

## 📋 Pre-Tagging Verification

### 1. Build and Compile Status
- [x] Workspace compile passes: `npm run build`
- [x] Shared package builds: `npm run build --prefix shared`
- [x] Backend package compiles: `npm run build --prefix backend`
- [x] Frontend static generation completes: `npm run build --prefix frontend`
- [x] Chrome extension compiles: `npm run build --prefix extension`

### 2. Test Suite Validation
- [x] Root workspace test command passes: `npm test`
- [x] Frontend unit tests pass: `npm test --prefix frontend` (58/58 tests passing)
- [x] Backend unit tests pass: `npm test --prefix backend` (25/25 tests passing)
- [x] Chrome extension unit tests pass: `npm test --prefix extension` (2/2 tests passing)
- [x] E2E test fallback passes: `npm run test:e2e --prefix frontend`

### 3. Safety and Security Rules
- [x] Git safety check script passes: `npm run check:git-safety` (no credentials, node_modules, or build artifacts tracked/staged)
- [x] Security scan script passes: `npm run check:security`
- [x] No `.env` or `.env.local` files tracked by git

### 4. Documentation and Links Check
- [x] Documentation link validation passes: `npm run check:docs` (over 330 markdown files verified)
- [x] Links inside documentation are relative to avoid absolute filepath breakages

---

## 🚀 Post-Release Verification

After creating the tag `v2.0.0-beta`, perform these checks:
1. Verify the tag exists in git: `git tag -l`
2. Check that the tag pushed to GitHub successfully.
3. Confirm that Vercel auto-deployment has started.
4. Verify the backend `/health` endpoint remains reachable.
