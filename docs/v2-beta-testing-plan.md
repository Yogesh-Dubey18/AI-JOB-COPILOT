# v2 Beta Testing Plan

## Smoke Flow

1. Register a new user.
2. Log in.
3. Complete onboarding.
4. Upload a TXT resume.
5. Run resume analysis.
6. Open jobs.
7. Match a job.
8. Tailor a resume.
9. Generate an application kit.
10. Create an application.
11. Update application status.
12. Add an interview.
13. Start a mock interview.
14. Open interview history.
15. Generate a PDF export.
16. Open analytics.
17. Open settings and privacy export.
18. Visit `/offline`.

## Extension Flow

1. Run `npm run build --prefix extension`.
2. Load `extension/dist` as an unpacked extension.
3. Open extension options.
4. Confirm local API and app URLs.
5. Log in to the web app in the same browser.
6. Open a public job page.
7. Parse visible job text.
8. Review and edit fields.
9. Save reviewed job.
10. Confirm the job appears in the app or is detected as a duplicate.

## PWA Flow

1. Build frontend.
2. Serve over localhost or HTTPS.
3. Confirm `/manifest.json` loads.
4. Confirm `/sw.js` loads.
5. Open `/offline`.
6. Disable network and navigate.
7. Confirm navigation falls back to `/offline`.

## Regression Focus

- Auth cookies and protected routes.
- AI fallback responses.
- File upload validation.
- Manual job import duplicate detection.
- User-owned data isolation.
- PDF export ownership checks.
- Privacy export/delete account behavior.
- Admin role protection.
- Mobile bottom navigation spacing.

## Exit Criteria

- No build/test failures.
- No tracked generated artifacts.
- No real secrets.
- No unlabelled mock/provider-ready claims.
- Manual smoke flow completes locally.
