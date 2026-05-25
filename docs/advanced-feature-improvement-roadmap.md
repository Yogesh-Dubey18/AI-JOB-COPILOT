# Advanced Feature Improvement Roadmap

Last audited: 2026-05-25
Purpose: prioritize realistic improvements that make AI Job Copilot more advanced, production-ready, SaaS-level, user-friendly, secure, and honest.

This roadmap is issue/sprint based. It does not create a new numbered project phase.

## Recommended Implementation Order

| Order | Priority | Improvement | Effort | Risk | Dependency/provider |
|---:|---|---|---|---|---|
| 1 | P0 | Remove fake-looking dashboard/analytics defaults | Small | Low | None |
| 2 | P0 | Complete protected route coverage | Small | Medium | Middleware tests |
| 3 | P0 | Add backend for company research, answer vault, career vault, contacts | Large | Medium | MongoDB |
| 4 | P0 | Fix GitHub analyzer API mismatch | Medium | Medium | AI provider optional, GitHub API later |
| 5 | P0 | Private resume/PDF storage with S3/R2 signed URLs | Large | High | S3/R2 credentials |
| 6 | P0 | Harden Google OAuth callback token handling | Medium | High | Google OAuth credentials |
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
* Current status: Backend returns `averageAtsScore: 82` when no resume analyses exist, and `weeklyApplicationChart` returns 1..7 applications by weekday.
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
* Current status: Core routes like `/dashboard`, `/resume`, `/jobs`, `/applications`, `/settings`, and `/admin` are protected; several private app routes load publicly.
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

### 3. Implement Missing Backend Routes For Frontend Vault Pages

* Feature name: Company, answer, career, and contacts backend completion
* Current status: Frontend pages exist for `/company-research`, `/answer-vault`, `/career-vault`, and `/contacts`; backend routes/models are missing.
* Problem: Pages load but fail at API calls.
* Why it matters: These are visible core workflow surfaces and make the product feel broken.
* Advanced realistic version: Each has a Mongoose model, service, route module, ownership checks, validation, audit logs, and integration links.
* User benefit: Users can save company notes, interview answers, career source-of-truth entries, and recruiter contacts reliably.
* Engineering work needed: Add models, validators, services, routes, app mounting, tests, and frontend error/success polish.
* Backend changes: New route modules under `/api/company-research`, `/api/answer-vault`, `/api/career-vault`, `/api/contacts`; models and service ownership checks.
* Frontend changes: Replace broken calls with typed API helpers and add entity cross-links.
* Provider/API dependency: MongoDB live; no external provider required.
* Security/privacy risk: Medium because these records contain personal career and recruiter data.
* Testing needed: Backend CRUD ownership tests; frontend empty/create/delete tests; route protection tests.
* Priority: P0
* Estimated effort: Large
* Suggested implementation phase: Audit Sprint A

### 4. Fix GitHub Analyzer API Mismatch

* Feature name: Working GitHub analyzer
* Current status: Frontend calls `/ai/github-analyzer`; backend does not define that endpoint.
* Problem: The tool appears available but fails on generate.
* Why it matters: It is a public feature card and important portfolio feature.
* Advanced realistic version: Manual analyzer works with AI fallback; optional GitHub API metadata is marked provider-ready until `GITHUB_TOKEN` or OAuth is configured.
* User benefit: Users get actionable README, case study, resume bullet, and interview feedback based on their real input.
* Engineering work needed: Add backend route, prompt/schema if needed, env key, and provider status.
* Backend changes: Add `/api/ai/github-analyzer`, AI service method, optional GitHub metadata service later.
* Frontend changes: Protect route, display fallback/provider status, remove broken-provider confusion.
* Provider/API dependency: AI provider optional; GitHub API provider-ready.
* Security/privacy risk: Low for public repos, Medium for private repo OAuth later.
* Testing needed: Backend AI fallback test; frontend form success/error tests.
* Priority: P0
* Estimated effort: Medium
* Suggested implementation phase: Audit Sprint A

### 5. Private Resume And Export Storage

* Feature name: S3/R2 private storage with signed URLs
* Current status: Uploads and generated PDFs are written to local disk and served from `/uploads`.
* Problem: Resume/PDF files can be public by URL and can disappear after Render restarts.
* Why it matters: Resume data is sensitive personal data and must be private for SaaS production.
* Advanced realistic version: Private object bucket, random object keys, server-side validation before upload, signed GET URLs, delete/export retention workflows.
* User benefit: Resumes and generated documents remain private, durable, and user-owned.
* Engineering work needed: Storage abstraction, S3/R2 client, migration plan, file ownership checks, signed download endpoints.
* Backend changes: Add storage service, use it in resume upload and PDF export, remove public static file serving for private data.
* Frontend changes: Download links call authenticated signed URL endpoint.
* Provider/API dependency: AWS S3 or Cloudflare R2 credentials.
* Security/privacy risk: High if delayed.
* Testing needed: Upload validation, signed URL auth, object deletion, no public URL regression.
* Priority: P0
* Estimated effort: Large
* Suggested implementation phase: Audit Sprint B

### 6. Harden Google OAuth Before Live Activation

* Feature name: Safe Google OAuth activation
* Current status: Provider-ready routes exist; callback redirects to `/login?googleToken=...`.
* Problem: Access token in query string can leak through browser history, logs, screenshots, and referrers.
* Why it matters: OAuth launch should not introduce credential exposure.
* Advanced realistic version: Backend sets httpOnly cookies and redirects without token, or frontend exchanges a one-time code for session via secure endpoint.
* User benefit: Google sign-in works without exposing tokens.
* Engineering work needed: Replace token transport, add state/nonce, error handling, disconnect, and tests.
* Backend changes: OAuth state cookie, callback session handling, no token query.
* Frontend changes: Consume success/error status without token in URL.
* Provider/API dependency: Google Cloud OAuth credentials.
* Security/privacy risk: High if enabled as-is.
* Testing needed: OAuth provider status tests, callback tests, no-token-in-URL assertion.
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
