# Advanced Feature Improvement Roadmap

Last audited: 2026-05-25
Purpose: prioritize realistic improvements that make AI Job Copilot more advanced, production-ready, SaaS-level, user-friendly, secure, and honest.

This roadmap is issue/sprint based. It does not create a new numbered project phase.

## Recommended Implementation Order

| Order | Priority | Improvement | Effort | Risk | Dependency/provider |
|---:|---|---|---|---|---|
| 1 | P0 | Remove fake-looking dashboard/analytics defaults | Small | Low | None; implemented and verified 2026-10-13 |
| 2 | P0 | Protect compare flows and add middleware route regression matrix | Small | Medium | None; implemented and verified 2026-10-13 |
| 3 | P0 | Add backend for company research, answer vault, career vault, contacts | Large | Medium | Implemented in current working tree; API routes/services/models and ownership tests present |
| 4 | P0 | Fix GitHub analyzer API mismatch | Medium | Medium | Implemented in current working tree; API route and fallback service present |
| 5 | P0 | Private resume/PDF storage with durable S3/R2 | Large | High | Owner-bound backend streaming and configuration validation implemented; provider credentials, live permissions, and legacy migration remain external |
| 6 | P0 | Harden Google OAuth callback token handling | Medium | High | State cookie and one-time code exchange implemented; Google credentials and staging verification remain external |
| 7 | P1 | Connect resume -> jobs -> kit -> tracker workflow with entity pickers | Large | Medium | MongoDB, existing APIs |
| 8 | P1 | Preserve job snapshots and official apply URLs in tracker | Medium | Medium | Job model/application model migration |
| 9 | P1 | Activate real Playwright E2E coverage | Medium | Medium | Playwright dependency/browsers |
| 10 | P1 | Wire forgot/reset/email verification | Medium | High | Email provider |
| 11 | P1 | Advanced resume diff/version system | Large | Medium | Storage, PDF/DOCX export |
| 12 | P1 | Company-aware interview and salary workflow | Large | Medium | Company research backend |
| 13 | P2 | Real billing with Stripe checkout/webhooks | Large | High | Stripe, legal/tax policy |
| 14 | P2 | Email/calendar reminders | Large | High | SendGrid/Gmail/Google Calendar |
| 15 | P2 | Real job provider activation roadmap | Large | High | Approved provider access |
| 16 | P2 | Public portfolio SaaS hardening | Medium | Medium | Privacy/legal review |
| 17 | P2 | Admin monitoring and Sentry integration | Medium | Medium | Sentry/Better Stack |
| 18 | P3 | Mobile navigation and UX polish | Medium | Low | Design QA |
| 19 | P3 | Accessibility and visual regression automation | Medium | Low | Playwright/axe |
| 20 | P3 | Content polish and mojibake cleanup | Small | Low | Docs/UI review |

## P0 Fixes

### 1. Remove Fake-Looking Dashboard And Analytics Defaults

* Feature name: Truthful analytics empty states
* Current status: Completed 2026-10-13. Empty analytics use no invented score or application events; all chart inputs are user-scoped records.
* Problem: Authenticated dashboards can show sample metrics as if they came from the user.
* Why it matters: The project explicitly must not fake metrics, users, success stories, interviews, or outcomes.
* Advanced realistic version: Return `null`, `0`, or `status: insufficient_data`; frontend displays "No data yet" and an action to run an analysis or add applications.
* User benefit: Users trust the dashboard because every number is traceable to their own activity.
* Engineering work needed: Update analytics service response shape and dashboard/chart empty states.
* Backend changes: Change fallback values in `analytics.service.ts`; include `hasData` flags.
* Frontend changes: Replace default metric values with empty cards and CTAs.
* Provider/API dependency: None.
* Security/privacy risk: Low.
* Testing needed: Backend tests for empty analytics; frontend tests for empty dashboard and analytics pages.
* Priority: P0
* Estimated effort: Small
* Suggested implementation phase: Audit Sprint A

### 2. Complete Protected Route Coverage

* Feature name: Protected route consistency
* Current status: Completed 2026-10-13. Private route registry and regression matrix cover the audited private route families and path boundaries. Server-side APIs retain their own auth checks.
* Problem: `/pdf-export`, `/guided-workflow`, `/company-research`, `/answer-vault`, `/career-vault`, `/contacts`, `/linkedin-optimizer`, `/github-analyzer`, `/learning-roadmap`, `/notifications`, and `/application-kit` are not covered by middleware.
* Why it matters: Publicly loaded private tools produce confusing 401 errors and increase privacy risk.
* Advanced realistic version: A single route registry declares public, protected, admin, and alias routes; middleware and tests use the same registry.
* User benefit: Signed-out users get predictable login redirects instead of broken screens.
* Engineering work needed: Expand middleware route list or generate it from a central config.
* Backend changes: None immediately.
* Frontend changes: Update middleware, route tests, and route docs.
* Provider/API dependency: None.
* Security/privacy risk: Medium.
* Testing needed: Playwright/Vitest route redirect matrix.
* Priority: P0
* Estimated effort: Small
* Suggested implementation phase: Audit Sprint A

## Implementation Results

### Completed 2026-10-13: Truthful analytics empty states

* `averageAtsScore` is now `null` until the user has a saved analysis; the backend no longer reports a default score of 82.
* The seven-day application chart is built from that user's non-saved applications and their actual `appliedDate` (falling back to record creation date). Empty days remain zero; saved jobs and dates outside the window are not counted.
* Resume-score and application-status charts now show empty states instead of sample series. The dashboard presents an unscored state and a resume-analysis action.
* Verification: full workspace build passed; full root test command passed (backend: 108 tests across 8 files; frontend: 89 tests across 2 files). Focused analytics, storage, and middleware regressions are included in those suites.

### Completed 2026-10-13: Compare route protection

* Added `/compare` and `/compare-job` to the private route registry because both pages load the signed-in user's resumes.
* Route matching now checks path boundaries, avoiding accidental matches such as `/dashboard-preview`.
* Added middleware regression coverage for the known private route families, auth-cookie/session access, public routes, path-prefix boundaries, and the `/learning-roadmap` alias (5 tests passed).

### Completed 2026-10-13: Local storage download hardening

* Removed Express's public static `/uploads` mount.
* Local storage URLs now include a short-lived HMAC-SHA256 signature, validated with constant-time comparison and normalized storage keys. Downloads are marked private/no-store and served as attachments.
* Added tests for valid downloads, invalid signatures, expiry, and the removed public static path; existing export/proof URL assertions now verify signed URL shape.
* Verification: backend TypeScript build passed; focused storage tests passed (5 tests). S3/R2 credentials and Cloudinary legacy access-mode review remain external/manual dependencies, so durable/private provider deployment is not claimed complete.

### Completed 2026-10-13: Owner-bound storage download authorization

* Local, S3/R2, and Cloudinary downloads use a short-lived backend URL; provider URLs and credentials are not returned to clients.
* HMAC signatures bind normalized object key, owner ID, and expiry. Production requires `STORAGE_SIGNING_SECRET` (at least 32 characters); expiry cannot exceed configured TTL.
* Each download rechecks resume, resume-version, PDF-export, proof-file, or archive ownership and current visibility/retention permissions. Deleted records revoke links.
* New Cloudinary raw uploads request authenticated delivery. Existing Cloudinary files are untouched and may remain directly public until an approved reversible migration is completed.
* Resume upload cleans temporary files on every exit path and removes newly stored objects if record creation fails. Incomplete S3/R2 configuration fails closed.
* Verification: root build passed. Final full backend tests passed (121 tests across 10 files); focused storage/analytics/OAuth tests passed (101 tests across 6 files before an added provider-config regression, then final focused AI/config tests passed 9 tests across 2 files). Git-safety, security-safety, and docs checks passed. No live S3/R2 credentials or Cloudinary console access were available; live provider permissions and existing asset exposure remain unverified.

### Completed 2026-10-13: Analytics integrity and authorization regression pass

* Aggregations use the authenticated user's actual records and UTC day buckets; empty days remain zero and missing ATS data is not imputed. Response, interview, shortlist, and offer statuses are counted distinctly, with no sample chart values.
* Analytics endpoints are server-authenticated; frontend route middleware remains a navigation layer, not the API authorization boundary.
* Verification: full monorepo build passed; final root tests passed (backend 121 tests/10 files, frontend 90 tests/2 files); git-safety, security-safety, and docs-link checks passed.

### Completed 2026-10-13: Google OAuth redirect token hardening

* Callback validates a 256-bit random state value against an HttpOnly, short-lived cookie using constant-time comparison.
* The callback stores only a SHA-256 hash of a random, 90-second one-time code and redirects with that code in the URL fragment. The frontend removes the fragment immediately and exchanges once; the backend returns tokens only from a no-store exchange response and sets auth cookies.
* Production requires `GOOGLE_REDIRECT_URI` when Google credentials are configured. No provider credentials were available, so live Google authentication remains unverified.
* Verification: OAuth service/API and frontend regressions passed; full backend/frontend suites and production build passed.

### 3. Implement Missing Backend Routes For Frontend Vault Pages

* Feature name: Company, answer, career, and contacts backend completion
* Current status: Completed in the current working tree. Backend route modules, models, user-scoped services, and API CRUD/ownership coverage exist; app mounts were verified.
* Problem: Pages load but fail at API calls.
* Why it matters: These are visible core workflow surfaces and make the product feel broken.
* Advanced realistic version: Each has a Mongoose model, service, route module, ownership checks, validation, audit logs, and integration links.
* User benefit: Users can save company notes, interview answers, career source-of-truth entries, and recruiter contacts reliably.
* Engineering work needed: Retain the ownership tests and validate these workflows with live MongoDB-backed staging.
* Backend changes: Routes under `/api/company-research`, `/api/answer-vault`, `/api/career-vault`, `/api/contacts`; models and service ownership checks are present.
* Frontend changes: Replace broken calls with typed API helpers and add entity cross-links.
* Provider/API dependency: MongoDB live; no external provider required.
* Security/privacy risk: Medium because these records contain personal career and recruiter data.
* Testing needed: Backend CRUD ownership tests; frontend empty/create/delete tests; route protection tests.
* Priority: P0
* Estimated effort: Large
* Suggested implementation phase: Audit Sprint A

### 4. Fix GitHub Analyzer API Mismatch

* Feature name: Working GitHub analyzer
* Current status: Completed in the current working tree. The frontend route `/api/ai/github-analyzer` exists and delegates to a safe fallback-capable proof-analysis service.
* Problem: The tool appears available but fails on generate.
* Why it matters: It is a public feature card and important portfolio feature.
* Advanced realistic version: Manual analyzer works with AI fallback; optional GitHub API metadata is marked provider-ready until `GITHUB_TOKEN` or OAuth is configured.
* User benefit: Users get actionable README, case study, resume bullet, and interview feedback based on their real input.
* Engineering work needed: Optional GitHub API metadata can be considered later; the current manual analysis path is implemented.
* Backend changes: `/api/ai/github-analyzer` route and service are present.
* Frontend changes: Protect route, display fallback/provider status, remove broken-provider confusion.
* Provider/API dependency: AI provider optional; GitHub API provider-ready.
* Security/privacy risk: Low for public repos, Medium for private repo OAuth later.
* Testing needed: Backend AI fallback test; frontend form success/error tests.
* Priority: P0
* Estimated effort: Medium
* Suggested implementation phase: Audit Sprint A

### 5. Private Resume And Export Storage

* Feature name: S3/R2 private storage with backend-authorized downloads
* Current status: All providers use expiring owner-bound backend download URLs with record checks. Local storage remains ephemeral. S3/R2 durability is not configured, and Cloudinary legacy privacy is not verified.
* Problem: Local files can disappear after Render restarts; production storage needs a private durable object store and a legacy-object migration plan.
* Why it matters: Resume data is sensitive personal data and must be private for SaaS production.
* Advanced realistic version: Private object bucket, random object keys, server-side validation before upload, signed GET URLs, delete/export retention workflows.
* User benefit: Resumes and generated documents remain private, durable, and user-owned.
* Engineering work needed: Configure private S3/R2, migrate existing objects, verify provider access modes, and preserve ownership/deletion checks.
* Backend changes: Existing storage abstraction now signs local fallback URLs and no longer exposes a static `/uploads` directory. Provider configuration and migration remain.
* Frontend changes: Existing download links use short-lived backend URLs. They are bearer capabilities; server authorization checks the owner-bound current record and its permissions on every request.
* Provider/API dependency: AWS S3 or Cloudflare R2 credentials.
* Security/privacy risk: High if delayed.
* Testing needed: Owner mismatch, expiry/tampering, absent object/record, no public static route, plus configured S3/R2 integration and legacy migration verification.
* Priority: P0
* Estimated effort: Large
* Suggested implementation phase: Audit Sprint B

### 6. Harden Google OAuth Before Live Activation

* Feature name: Safe Google OAuth activation
* Current status: Callback uses a one-time opaque handoff in the URL fragment, an HttpOnly OAuth state cookie, and a backend exchange endpoint. Access and refresh JWTs are not placed in redirect URLs.
* Problem: Live Google credentials and callback configuration are not present in this local environment, so provider behavior on the deployed domain remains unverified.
* Why it matters: OAuth launch should not introduce credential exposure.
* Advanced realistic version: Short-lived, single-use random handoff code stored as a hash, exchanged once by the frontend; state validated in constant time; exchange response is no-store.
* User benefit: Google sign-in works without exposing tokens.
* Engineering work needed: Configure production Google OAuth credentials and verify the callback/logout/logout-cookie behavior against Google on staging.
* Backend changes: Implemented state cookie, handoff persistence and atomic consume, exchange endpoint, error handling, and no-store/referrer controls.
* Frontend changes: Implemented fragment handoff consumption, immediate fragment removal, session persistence, and dashboard redirect.
* Provider/API dependency: Google Cloud OAuth credentials.
* Security/privacy risk: High if enabled as-is.
* Testing needed: Unit/API and frontend exchange regressions added; live Google callback test remains manual.
* Priority: P0
* Estimated effort: Medium
* Suggested implementation phase: Audit Sprint B

## P1 Advanced Features

### 7. Connected Entity Pickers Across Resume, Jobs, Kit, And Tracker

* Feature name: End-to-end application workflow
* Current status: Users often type IDs manually and use disconnected pages.
* Problem: Application kit and PDF export workflows require internal IDs and do not naturally connect selected resume/job/application state.
* Why it matters: SaaS users expect guided entity selection, not developer-style ID entry.
* Advanced realistic version: Resume selector, saved job selector, application kit builder, save-to-tracker action, generated kit preview, and next action footer.
* User benefit: A user can go from uploaded resume to selected job to tailored kit to tracker without losing context.
* Engineering work needed: Shared selectors, query params, relationship fields, workflow state.
* Backend changes: Add application kit attach/update endpoints; expand application snapshots.
* Frontend changes: Replace raw ID forms with dropdowns/search, success modals, next actions.
* Provider/API dependency: None beyond MongoDB.
* Security/privacy risk: Medium because cross-entity ownership must be enforced.
* Testing needed: E2E for resume -> jobs -> kit -> tracker.
* Priority: P1
* Estimated effort: Large
* Suggested implementation phase: Audit Sprint C

### 8. Job Snapshot And Apply URL Preservation

* Feature name: Reliable saved job records
* Current status: `saveJob` creates an application with role/company/source but not official apply URL or full job snapshot.
* Problem: Users can lose the original job context.
* Why it matters: Job postings expire or change; tracker needs immutable evidence of what the user applied to.
* Advanced realistic version: Application stores apply URL, source URL, salary, location, trust score, skills, source type, and snapshot timestamp.
* User benefit: Users can always reopen the apply URL and recall why they chose the job.
* Engineering work needed: Schema update, save service expansion, UI display.
* Backend changes: Extend `Application` model and `saveJob`.
* Frontend changes: Show job snapshot in tracker/detail pages.
* Provider/API dependency: None.
* Security/privacy risk: Low.
* Testing needed: Save job API test and tracker UI test.
* Priority: P1
* Estimated effort: Medium
* Suggested implementation phase: Audit Sprint C

### 9. Real Playwright E2E Pipeline

* Feature name: Active browser workflow verification
* Current status: Playwright config/spec exists, but dependency is not installed and script skips.
* Problem: CI can claim E2E command success without browser tests running.
* Why it matters: This product has many connected workflows that unit tests cannot fully verify.
* Advanced realistic version: CI installs Playwright, runs smoke workflows against seeded backend/frontend, captures traces on failure.
* User benefit: Fewer broken routes and regressions reach live demo users.
* Engineering work needed: Add dependency, install browsers, stable seeds, non-watch mode, CI timeout tuning.
* Backend changes: Test seed user/data endpoints or seed script.
* Frontend changes: E2E specs for login, upload, analyzer, jobs, kit, tracker, settings.
* Provider/API dependency: None for mock/fallback tests.
* Security/privacy risk: Low.
* Testing needed: The E2E suite itself.
* Priority: P1
* Estimated effort: Medium
* Suggested implementation phase: Audit Sprint C

### 10. Forgot Password, Email Verification, And Account Verification

* Feature name: Production auth lifecycle
* Current status: Backend placeholders and frontend shell pages exist.
* Problem: Password reset and verification do not truly work.
* Why it matters: Real SaaS users need account recovery and verified contact channels.
* Advanced realistic version: Signed reset tokens, one-time expiry, email provider send, verification banner, resend flow, audit events.
* User benefit: Users can recover accounts and trust email-based notifications.
* Engineering work needed: Token storage, email templates, frontend forms, abuse rate limits.
* Backend changes: Password reset token model/fields, email send integration, verification endpoints.
* Frontend changes: Wire forgot/reset forms, add verification banners.
* Provider/API dependency: SendGrid/SMTP/Resend.
* Security/privacy risk: High if implemented incorrectly.
* Testing needed: Token expiry, invalid token, reset success, email mock tests.
* Priority: P1
* Estimated effort: Medium
* Suggested implementation phase: Audit Sprint D

### 11. Advanced Resume Versioning And Diff

* Feature name: Resume version history and compare
* Current status: Resume versions are created after improve; preview is basic.
* Problem: Users cannot compare original vs improved or understand exactly what changed.
* Why it matters: Resume edits affect career outcomes and must remain truthful.
* Advanced realistic version: Side-by-side diff, accepted/rejected suggestions, role-specific versions, section completeness, one-page check, recruiter preview.
* User benefit: Users control every resume change and avoid invented claims.
* Engineering work needed: Version diff model, UI compare, selected suggestions passed to backend.
* Backend changes: Store suggestion IDs/accepted changes; version metadata.
* Frontend changes: Diff viewer, suggestion apply flow, version selector.
* Provider/API dependency: AI optional, storage for exports.
* Security/privacy risk: Medium.
* Testing needed: Diff generation, suggestion selection, no invented fields tests.
* Priority: P1
* Estimated effort: Large
* Suggested implementation phase: Audit Sprint D

### 12. Company-Aware Interview And Salary Workflow

* Feature name: Company research connected to prep
* Current status: Company research frontend is broken; salary templates are static.
* Problem: Company notes do not inform interview prep, application kit, or tracker.
* Why it matters: Users need company-specific preparation and salary confidence.
* Advanced realistic version: Company profile, role/job link, salary confidence, red flags, interview round planner, and answer templates using saved context.
* User benefit: Better interview readiness and negotiation clarity without scraping restricted sites.
* Engineering work needed: Company research backend, context linking, templates.
* Backend changes: Company model, application/job relations, prep endpoints.
* Frontend changes: Company detail page, link from job/application/interview pages.
* Provider/API dependency: Optional public news API later; no scraping.
* Security/privacy risk: Medium.
* Testing needed: CRUD ownership, linked prep generation, template copy tests.
* Priority: P1
* Estimated effort: Large
* Suggested implementation phase: Audit Sprint D

## P2 SaaS/Product Features

### 13. Stripe Billing Activation

* Feature name: Real subscriptions and usage limits
* Current status: Pricing is disabled; settings billing has mock checkout/demo activation.
* Problem: No real checkout, webhook verification, invoices, cancellations, or plan enforcement through Stripe.
* Why it matters: Paid SaaS requires accurate billing and legal/commercial support.
* Advanced realistic version: Stripe Checkout, customer portal, webhook-synced subscriptions, usage limits, invoices, cancellation/refund docs.
* User benefit: Clear paid plan lifecycle and no surprise charges.
* Engineering work needed: Stripe SDK, webhook endpoint, idempotency, customer model, support docs.
* Backend changes: Checkout/session/webhook/subscription sync.
* Frontend changes: Pricing waitlist/live checkout states, billing portal.
* Provider/API dependency: Stripe account, tax/legal setup.
* Security/privacy risk: High due to payment data and webhook integrity.
* Testing needed: Stripe test mode, webhook signature, plan enforcement.
* Priority: P2
* Estimated effort: Large
* Suggested implementation phase: SaaS Sprint E

### 14. Email And Calendar Reminders

* Feature name: Provider-backed reminders
* Current status: Dashboard notifications are live; email/calendar are mock/provider-ready.
* Problem: Users can enable preferences but no real external reminder is sent.
* Why it matters: Follow-up and interview reminders are core job-search reliability features.
* Advanced realistic version: Email delivery, calendar event creation, reminder queue, unsubscribe/preferences, retry logs.
* User benefit: Users do not miss follow-ups or interviews.
* Engineering work needed: Provider wiring, Redis/queue, worker, settings validation.
* Backend changes: Email/calendar services, reminder scheduler worker, delivery logs.
* Frontend changes: Channel status badges, verified email prompt, test notification button.
* Provider/API dependency: SendGrid/SMTP, Google Calendar OAuth, Redis.
* Security/privacy risk: High because emails and calendar events contain personal job data.
* Testing needed: Mock provider tests, delivery log tests, provider-ready UI tests.
* Priority: P2
* Estimated effort: Large
* Suggested implementation phase: SaaS Sprint E

### 15. Approved Job Provider Integrations

* Feature name: Live job provider ingestion
* Current status: LinkedIn, Indeed, Naukri, ZipRecruiter, and Dice are provider-ready only.
* Problem: Jobs are curated/sample/manual rather than live provider data.
* Why it matters: A job discovery product needs fresh and legally sourced data.
* Advanced realistic version: Approved APIs/feeds only, provider labels, rate limits, dedupe, source confidence, import logs, no scraping.
* User benefit: Fresher-friendly job discovery becomes more realistic and current.
* Engineering work needed: Provider adapters, scheduled imports, admin review queue.
* Backend changes: Import jobs, source logs, rate limits, dedupe, trust scoring.
* Frontend changes: Provider filters, source freshness, "sample vs live" labels.
* Provider/API dependency: Approved provider credentials.
* Security/privacy risk: Medium, plus terms-of-service risk.
* Testing needed: Adapter contract tests and import dry-run tests.
* Priority: P2
* Estimated effort: Large
* Suggested implementation phase: SaaS Sprint F

### 16. Public Portfolio SaaS Hardening

* Feature name: Privacy-safe public portfolio hosting
* Current status: Public `/u/[slug]` profiles exist with publish toggles.
* Problem: Public sharing needs abuse controls, stronger privacy defaults, and export/share UX.
* Why it matters: Public pages can expose personal career data.
* Advanced realistic version: Preview before publish, share analytics only if opted in, report abuse, unlisted mode, custom slugs, PDF export button.
* User benefit: Users can share proof-of-work safely with recruiters.
* Engineering work needed: Public profile settings, moderation/report flow, export integration.
* Backend changes: Public profile privacy/audit fields and report endpoint.
* Frontend changes: Publish checklist, PDF export CTA, public page metadata.
* Provider/API dependency: Optional custom domain/Vercel config later.
* Security/privacy risk: Medium.
* Testing needed: Published/private visibility tests and privacy section tests.
* Priority: P2
* Estimated effort: Medium
* Suggested implementation phase: SaaS Sprint F

### 17. Monitoring And Incident Readiness

* Feature name: Production observability
* Current status: Backend monitoring provider is `noop`; Better Stack is documented as manually active.
* Problem: No external error events, source maps, alert ownership, or incident dashboard are wired.
* Why it matters: Production SaaS needs fast detection and private-data-safe diagnostics.
* Advanced realistic version: Sentry frontend/backend with redaction, Better Stack runbook, uptime status, incident templates, admin health dashboard.
* User benefit: Fewer silent failures and clearer status communication.
* Engineering work needed: SDK setup, redaction, environment config, alert routing.
* Backend changes: Sentry capture, structured logs, health dependency checks.
* Frontend changes: Error boundary capture and status link.
* Provider/API dependency: Sentry, Better Stack.
* Security/privacy risk: Medium due to monitoring data leakage.
* Testing needed: Redaction tests and staging test event.
* Priority: P2
* Estimated effort: Medium
* Suggested implementation phase: SaaS Sprint F

## P3 Polish

### 18. Mobile Navigation And Guided UX

* Feature name: Mobile app navigation upgrade
* Current status: Mobile bottom nav exposes only five routes.
* Problem: Many features are difficult to find on mobile.
* Why it matters: Job seekers often work from mobile devices.
* Advanced realistic version: Bottom nav plus "More" sheet, global search, sticky next-action footer, route-aware breadcrumbs.
* User benefit: Faster navigation and fewer lost workflows.
* Engineering work needed: App shell navigation redesign and mobile QA.
* Backend changes: None.
* Frontend changes: Mobile nav, command/search menu, feature grouping.
* Provider/API dependency: None.
* Security/privacy risk: Low.
* Testing needed: Mobile Playwright visual and interaction tests.
* Priority: P3
* Estimated effort: Medium
* Suggested implementation phase: Polish Sprint G

### 19. Accessibility And Visual Regression Automation

* Feature name: Accessible, stable UI QA
* Current status: Accessibility docs exist; automated axe/visual checks are not active.
* Problem: Mobile/accessibility regressions can slip through.
* Why it matters: SaaS UX should be usable across devices and assistive tech.
* Advanced realistic version: Playwright + axe checks for public/protected routes, screenshots on desktop/mobile, keyboard navigation tests.
* User benefit: More reliable and inclusive UI.
* Engineering work needed: Add tooling and test matrix.
* Backend changes: None.
* Frontend changes: Tests and minor accessibility fixes from findings.
* Provider/API dependency: None.
* Security/privacy risk: Low.
* Testing needed: Axe, keyboard, mobile screenshots.
* Priority: P3
* Estimated effort: Medium
* Suggested implementation phase: Polish Sprint G

### 20. Content Encoding And Copy Polish

* Feature name: Production copy cleanup
* Current status: Some UI and docs contain mojibake characters from encoding issues.
* Problem: Broken characters reduce trust and polish.
* Why it matters: Career tools depend on user trust.
* Advanced realistic version: UTF-8 cleanup, consistent ASCII or intentional Unicode, no unsupported metric claims, consistent provider labels.
* User benefit: Cleaner, more professional product experience.
* Engineering work needed: Copy audit and regression tests for key strings.
* Backend changes: None unless API messages contain encoding artifacts.
* Frontend changes: Replace broken strings and unsupported claims.
* Provider/API dependency: None.
* Security/privacy risk: Low.
* Testing needed: Snapshot/string tests for key pages.
* Priority: P3
* Estimated effort: Small
* Suggested implementation phase: Polish Sprint G

## What Not To Build Yet

- Do not add auto-apply or auto-message sending.
- Do not scrape LinkedIn, Indeed, Naukri, ZipRecruiter, Dice, Glassdoor, AmbitionBox, or other restricted websites.
- Do not mark AI, billing, email, calendar, storage, job boards, GitHub, or monitoring as live until configured and verified.
- Do not add fake testimonials, fake beta counts, fake success metrics, or guaranteed interview/job claims.
- Do not create another broad feature wave before stabilizing the existing workflow.
