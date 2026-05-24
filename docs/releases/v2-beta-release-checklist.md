# Release Checklist — v2.0.0-beta

Use this checklist to execute the release of `v2.0.0-beta` in production:

---

## 🏁 Pre-Tagging Steps

- [x] Run safety audit: `npm run check:git-safety`
- [x] Run security audit: `npm run check:security`
- [x] Run link checker: `npm run check:docs`
- [x] Compile all workspace code: `npm run build`
- [x] Verify backend tests: `npm test --prefix backend`
- [x] Verify frontend tests: `npm test --prefix frontend`
- [x] Verify extension tests: `npm test --prefix extension`

---

## 🏷️ Release Tagging

Run these git commands in order:
1. `git add .`
2. `git commit -m "Prepare v2 beta release materials"`
3. `git push origin main`
4. `git tag -a v2.0.0-beta -m "AI Job Copilot v2 beta"`
5. `git push origin v2.0.0-beta`

---

## 🚀 Post-Release Verification

- [ ] Confirm Vercel deployment of the frontend tag succeeded.
- [ ] Confirm Render build logs show successful deployment of the backend.
- [ ] Verify that `/health` returns `{ success: true }`.
