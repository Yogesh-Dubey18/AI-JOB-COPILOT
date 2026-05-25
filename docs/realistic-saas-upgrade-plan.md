# Realistic SaaS Upgrade Plan

Last audited: 2026-05-25
Goal: define what is real today, what is mock/provider-ready, and what must be added before AI Job Copilot can be treated as a production SaaS.

## What Makes The Project Realistic Now

AI Job Copilot already has the skeleton of a serious SaaS product:

- Split Next.js frontend and Express/TypeScript backend.
- MongoDB-backed live deployment on the backend.
- Auth with hashed passwords, JWT access tokens, refresh-token rotation, httpOnly cookies, rate limiting, and protected admin APIs.
- Resume upload with backend file-size enforcement and magic-number validation.
- ATS scoring with local heuristics, AI fallback architecture, privacy/anonymization options, and no raw prompt storage in AI logs.
- Curated/manual job model with trust scoring, duplicate detection, risk flags, and official apply URL fields.
- Application tracker with status pipeline, follow-up dates, status history, and notification creation.
- Application kit generation saved in MongoDB.
- Portfolio/public profile model with publish controls.
- Feedback intake and admin triage foundations.
- Privacy export/delete foundations.
- Billing plan and usage-limit foundations.
- Provider status docs and UI that mostly avoid fake live claims.
- CI safety checks, backend tests, frontend tests, and extension tests.
- Live frontend and backend health endpoints.

## What Is Still Mock, Fallback, Provider-Ready, Or Not Configured

| Area | Current realistic classification | Evidence | SaaS implication |
|---|---|---|---|
| Database | Live | `/ready` reports MongoDB connected. | Real persistence is available. |
| AI | Mock/Fallback | `/status` reports AI provider `mock`. | AI outputs are safe fallbacks unless keys are configured. |
| Resume storage | Provider-ready, not live | Files are written to local `uploads/` and served statically. | Not production-private or durable. |
| PDF storage | Provider-ready, not live | Native PDFs written to local `uploads/exports`. | Exports can disappear and are public by URL. |
| Email | Mock/Fallback | `/status` reports email provider `mock`. | No real password reset or reminder email delivery. |
| Calendar | Mock/Fallback | `/status` reports calendar provider `mock`. | Interview reminders are dashboard/local only. |
| Billing | Mock/Fallback | `/status` reports billing provider `mock`; pricing disabled. | No real charging or subscription lifecycle. |
| Google OAuth | Provider-ready | Routes/status exist; credentials are not confirmed live. | Must fix token transport before enabling. |
| Job boards | Provider-ready/manual | Source readiness exists; no external provider is configured. | Live job feeds require approved APIs/feeds. |
| GitHub API | Not configured | UI mentions `GITHUB_TOKEN`; backend route/env is missing. | Manual analyzer only until route/provider are added. |
| Sentry | Not configured | Monitoring provider is `noop`. | Production errors are not externally tracked. |
| Better Stack | Needs manual setup verification | Docs say monitors are active; no API proof in repo. | Keep as documented manual operation unless dashboard proof is added outside secrets. |
| Course APIs | Not configured | Env examples include course vars; runtime wiring is limited. | Skill plans are AI/static fallback, not live course marketplace. |
| Chrome extension | Provider-ready | Manual capture foundation exists. | Needs packaging, permissions review, and Web Store workflow. |

## Production SaaS Requirements

### 1. Trustworthy Data And Metrics

Required before production:

- Remove all sample-looking dashboard metrics from authenticated user dashboards.
- Every user-facing metric must come from real user-owned records or display "No data yet".
- Label seed jobs as sample/curated and do not present them as live job-board data.
- Remove unsupported metric claims such as "3x more responses" unless backed by a real cited source.

Verification:

- Fresh account dashboard shows empty states, not `82` ATS or weekly fake application counts.
- Seed job cards or docs clearly state "sample/curated".

### 2. Private File And Resume Handling

Required before production:

- Move resumes and exports to private S3/R2 storage.
- Stop serving private user files from public `/uploads`.
- Use signed, short-lived download URLs after ownership checks.
- Add delete/export handling for object storage.
- Define data retention policy for uploaded raw files, extracted text, and generated PDFs.

Verification:

- Direct object URL is not public.
- User A cannot access User B downloads.
- Deleting account removes database records and queues object deletion.

### 3. Complete Auth Lifecycle

Required before production:

- Wire forgot password and reset password to a real email-token flow.
- Add email verification after signup.
- Add session/device management and revoke sessions.
- Fix Google OAuth callback so access tokens are never placed in URLs.
- Review CSRF posture for cross-site cookies.

Verification:

- Password reset email works in test provider mode.
- Google login leaves no token in browser URL/history.
- Protected route matrix passes in Playwright.

### 4. Route And Workflow Integrity

Required before production:

- Protect every private app route.
- Add backend APIs for company research, answer vault, career vault, and contacts.
- Add route aliases/redirects for `/tracker`, `/career-operating-system`, `/interview-prep`, and `/skill-roadmap` if those names remain in docs.
- Replace internal ID forms with entity selectors.
- Preserve job snapshots and apply URLs in tracker records.

Verification:

- Signed-out private routes redirect to login.
- Company/answer/career/contact pages create, list, update, and delete records.
- End-to-end flow works from resume upload to tracked application.

### 5. Provider Activation

Required manual credentials:

| Provider | Manual owner action |
|---|---|
| OpenAI or Gemini | Create API key, configure spending limits, add key to Render, verify provider status. |
| S3 or R2 | Create private bucket, access keys, lifecycle rules, CORS if needed, add env vars to Render. |
| SendGrid/SMTP/Resend | Verify sender/domain, add API key, test password reset and notification email. |
| Google OAuth | Create OAuth app, configure redirect URIs, publish/verify consent screen if required. |
| Google Calendar | Configure OAuth scopes and consent for calendar event creation. |
| Stripe | Create products/prices, webhook endpoint, tax/refund/cancellation process, test mode verification. |
| Job providers | Obtain approved APIs/feeds. Do not scrape restricted sites. |
| GitHub | Add token or OAuth app only for approved metadata access. |
| Sentry | Configure DSNs and redaction. |
| Better Stack | Confirm monitor URLs and alert channels manually. |

### 6. Legal, Privacy, And Commercial Review

Required before paid/public SaaS:

- Lawyer-reviewed privacy policy, terms, billing terms, refund/cancellation terms, and data retention policy.
- DPDPA/GDPR-style data rights workflow if serving users in India/EU or global markets.
- AI disclaimer that explains limits and user responsibility.
- Job-board terms compliance for every provider.
- Support/security reporting policy with non-personal support email/domain.
- Consent model for recruiter portal and public portfolios.

Verification:

- Legal docs are current, hosted, and linked from signup/pricing/footer.
- Data export/delete runbook includes external providers and backups.
- No guarantee of job, interview, salary, or selection appears anywhere.

### 7. Real User Validation

Required before scaling:

- Collect real open beta feedback without fake counts.
- Track actual pain points by route/workflow.
- Record reproducible bugs in triage board.
- Add product analytics only after privacy disclosure and opt-out.
- Validate pricing willingness before enabling Stripe.

Verification:

- Feedback log contains only real entries.
- Triage board links accepted issues to fixes.
- Roadmap reflects actual user blockers, not only feature ideas.

## Provider Setup Blockers

1. AI keys are absent on deployed backend; AI is mock/fallback.
2. Storage env vars are present in examples but not wired in runtime env config/service.
3. Email provider is mock; forgot/reset cannot send real messages.
4. Stripe checkout/webhooks are intentionally mock-safe.
5. Google OAuth provider-ready code needs safer callback session handling before live enablement.
6. GitHub analyzer route/env mismatch blocks the UI.
7. Job-board integrations require external approval and must not scrape.
8. Monitoring provider is `noop`; Sentry is not active.
9. Better Stack is documented as active but must be verified in the external dashboard.

## SaaS Readiness Levels

| Level | Description | Current fit |
|---|---|---|
| Portfolio demo | Shows architecture and workflows honestly with mock/provider-ready fallbacks. | Yes |
| Open beta | Real users can test core flows with clear limitations. | Partially, after P0 broken route fixes |
| Production beta | Real auth recovery, private storage, monitoring, route stability, and E2E coverage. | Not yet |
| Paid SaaS | Billing/legal/provider operations, support, privacy compliance, and production reliability. | Not yet |

## Upgrade Path

1. Stabilize truth and protection: remove fake-looking metrics, protect routes, fix broken API pages.
2. Stabilize privacy: private file storage, signed URLs, delete/export handling.
3. Stabilize auth: reset email, verification, safe Google OAuth.
4. Stabilize workflow: connect resume, jobs, kit, tracker, company research, answers, interviews.
5. Stabilize verification: active E2E, accessibility, security, live smoke tests.
6. Activate providers one by one with manual credentials and verification.
7. Only then consider paid SaaS billing and wider launch.

## Honest Launch Language

Use:

- "Open beta"
- "Provider-ready"
- "Mock/fallback AI when provider keys are missing"
- "Curated/sample jobs unless live provider is configured"
- "User-reviewed drafts"
- "No auto-apply"

Avoid:

- "Guaranteed interviews"
- "Guaranteed jobs"
- "Live LinkedIn/Indeed/Naukri data" unless verified with approved APIs
- "Real billing active" before Stripe is verified
- "Real AI active" before provider status confirms non-mock
- "Thousands of users/testimonials/success rate" unless backed by real data
