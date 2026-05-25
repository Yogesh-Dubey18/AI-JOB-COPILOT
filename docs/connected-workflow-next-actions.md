# Connected Workflow Next Actions

Last audited: 2026-05-25
Purpose: define the exact next implementation batches after the full website and codebase audit. This is a planning document only.

This plan intentionally uses focused issue batches and sprints. It does not create a new numbered project phase.

## Current Connected Workflow Reality

The strongest existing path is:

1. Register/login.
2. Upload resume.
3. Analyze resume.
4. Apply generic improvement.
5. Preview tailored draft.
6. Open PDF export or job discovery.

The path weakens after that:

- Job discovery is curated/sample/provider-ready, not live provider data.
- Application kit generation requires raw IDs instead of pickers.
- Saving a job to tracker does not preserve apply URL or full job snapshot.
- Company research, answer vault, career vault, and contacts have frontend pages but no backend APIs.
- Several private tools load publicly and then fail on API calls.
- Dashboard and analytics can show sample-looking metrics before real user data exists.

## Recommended First 5 Fixes

### 1. Make user dashboards truthful

- Remove fallback `82` ATS score and fake weekly chart values.
- Show "No data yet" empty states for fresh accounts.
- Add tests proving fresh account metrics are not fabricated.

Verification:

- New user dashboard shows profile/action prompts, not fake metrics.
- Analytics charts hide or show empty state until real records exist.

### 2. Protect every private app route

- Add middleware coverage for `/pdf-export`, `/guided-workflow`, `/company-research`, `/answer-vault`, `/career-vault`, `/contacts`, `/linkedin-optimizer`, `/github-analyzer`, `/learning-roadmap`, `/notifications`, and `/application-kit`.
- Add route redirect tests.

Verification:

- Signed-out checks return 307 to `/login?next=...` for all private tools.
- Public pages still return 200.

### 3. Fix broken frontend/API mismatches

- Add backend routes/models/services for company research, answer vault, career vault, and contacts.
- Add missing `/api/ai/github-analyzer` or update frontend to the correct existing endpoint.
- Add route ownership checks for all new records.

Verification:

- Create/list/delete company research, answers, career entries, and contacts.
- GitHub analyzer returns a provider-labeled fallback result.

### 4. Connect application kit to tracker

- Replace raw ID entry with saved job and resume selectors.
- Add "Save kit to tracker" action.
- Store `applicationKitId`, `resumeVersionId`, apply URL, and job snapshot on the application.

Verification:

- User selects a saved job, generates a kit, saves it to tracker, and sees the same job context in the application detail page.

### 5. Start private storage migration

- Add storage abstraction for local/S3/R2.
- Keep local mode for development, but stop treating local public `/uploads` as production safe.
- Add signed download endpoint design and tests before provider activation.

Verification:

- In local mode, ownership checks still pass.
- In S3/R2 mode, private object upload and signed URL download work in staging.

## Recommended Next Sprint

### Sprint A: Truth, Protection, And Broken Route Stabilization

Goal: make the current site reliable without adding broad new feature surfaces.

Tasks:

- Remove fake-looking dashboard/analytics defaults.
- Expand protected route middleware.
- Add route protection regression tests.
- Add backend CRUD for company research, answer vault, career vault, contacts.
- Fix GitHub analyzer backend route mismatch.
- Update route labels and aliases for `/tracker`, `/interview-prep`, `/skill-roadmap`, and `/career-operating-system`.
- Remove unsupported "3x more responses" copy from LinkedIn optimizer.

Definition of done:

- Fresh account has no fake metrics.
- Every route in the audit matrix either loads, redirects correctly, or has an intentional alias.
- No frontend page calls an unmapped backend API.
- `npm run check:docs`, `npm run check:git-safety`, `npm run check:security`, frontend tests, backend tests, and relevant build steps pass.

### Sprint B: Privacy And Storage Hardening

Goal: make resume and generated document handling production-safe.

Tasks:

- Add storage provider abstraction.
- Implement S3/R2 private object storage.
- Generate signed download URLs.
- Remove or restrict public `/uploads` exposure for private files.
- Add file deletion on account deletion.
- Add storage provider status to `/settings/integrations`.

Definition of done:

- Uploaded resumes are not public by static URL.
- Generated exports require auth/ownership before download.
- Account deletion includes storage delete path.

### Sprint C: Connected Job Application Workflow

Goal: turn the strongest isolated tools into one coherent job application path.

Tasks:

- Add saved job selector to apply assistant.
- Add resume/resume version selector to apply assistant and PDF export.
- Add "Generate kit" from job detail.
- Add "Save kit to tracker".
- Store job snapshot and apply URL in application.
- Add application detail sections for kit, resume, job, follow-up, replies, and timeline.

Definition of done:

- Resume -> jobs -> selected job -> application kit -> tracker works without raw IDs.
- Application detail preserves all context needed for follow-up and interview prep.

### Sprint D: Auth Recovery And Provider-Safe Activation

Goal: make account lifecycle and provider status production credible.

Tasks:

- Wire forgot/reset password.
- Add email verification.
- Fix Google OAuth token-in-query callback.
- Add session/device management foundation.
- Make integrations page complete: S3/R2, Google Calendar, GitHub, Sentry, Better Stack, course APIs.

Definition of done:

- Password reset works through a mock email provider locally and real provider in staging.
- Google login does not expose tokens in URLs.
- Integration page matches backend/provider config exactly.

### Sprint E: E2E And Release Confidence

Goal: make CI catch real broken workflows.

Tasks:

- Install Playwright and browsers in CI.
- Add seeded non-watch E2E flow for signup/login, protected redirects, resume upload, analyzer, jobs, application kit, tracker, company research, settings integrations.
- Add accessibility smoke tests.
- Add mobile screenshot checks for app shell and key forms.

Definition of done:

- CI fails when protected routes leak or connected workflows break.
- E2E no longer silently skips.

## What Not To Do

- Do not implement auto-apply.
- Do not auto-send recruiter messages or emails without explicit user review.
- Do not scrape protected job sites.
- Do not mark provider-ready integrations as live without credentials and verification.
- Do not add fake jobs, testimonials, users, success metrics, or interview/job guarantees.
- Do not start a broad feature expansion before fixing broken routes and privacy gaps.
- Do not commit `.env` files, uploaded resumes, generated PDFs, `.next`, coverage, test-results, or node_modules.
- Do not create a release tag for this audit.

## Verification Checklist For The Next Implementation Batch

Repository safety:

- [ ] `git status --short` reviewed before staging.
- [ ] No `.env` files staged except examples.
- [ ] No uploaded resumes, generated PDFs, node_modules, `.next`, coverage, or test-results staged.
- [ ] No fake provider success, fake job data, fake testimonials, or fake metrics added.

Route checks:

- [ ] Public routes return 200: `/`, `/login`, `/register`, `/features`, `/pricing`, `/feedback`, `/blog`, `/resources`, `/recruiters`, `/contact`, `/about`.
- [ ] Private routes redirect when signed out.
- [ ] Alias routes redirect intentionally: `/tracker`, `/interview-prep`, `/skill-roadmap`, `/career-operating-system` if implemented as aliases.

Workflow checks:

- [ ] Register/login persists through refresh.
- [ ] Resume upload rejects fake PDF/executable/oversize files.
- [ ] Analyzer produces real empty/error states when no resume exists.
- [ ] Apply assistant can select job and resume without raw IDs.
- [ ] Tracker shows apply URL and job snapshot.
- [ ] Company research, answer vault, career vault, and contacts save records.

Provider honesty:

- [ ] AI status says mock/fallback until provider key is configured.
- [ ] Billing says mock until Stripe is configured and tested.
- [ ] Email/calendar say provider-ready until real send/event creation works.
- [ ] Job boards say provider-ready until approved APIs/feeds are configured.
- [ ] Storage says local/dev or S3/R2 live accurately.

Security/privacy:

- [ ] No access token appears in URLs.
- [ ] Private files are not public static URLs in production mode.
- [ ] Logs do not include raw resumes, provider keys, auth tokens, or full AI prompts.
- [ ] Account deletion path includes database and storage records.

Testing:

- [ ] Backend API tests pass.
- [ ] Frontend unit tests pass.
- [ ] Route protection tests pass.
- [ ] E2E tests run actively, not skip silently.
- [ ] Docs, git safety, and security checks pass.

## Exact Next Implementation Prompt

Use this when ready to implement the next sprint:

```text
Implement Sprint A from docs/connected-workflow-next-actions.md only. Do not add new broad features. Fix truthful analytics empty states, complete protected route middleware coverage, add backend CRUD for company research/answer vault/career vault/contacts, fix GitHub analyzer API mismatch, add route aliases for requested missing routes, and remove unsupported metric claims. Add focused tests and run the required verification checks. Do not create a new numbered project phase.
```
