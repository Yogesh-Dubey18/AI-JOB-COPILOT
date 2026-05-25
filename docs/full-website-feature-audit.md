# Full Website Feature Audit

Last audited: 2026-05-25
Scope: deployed frontend, deployed backend health/status, repository docs, frontend routes, backend routes/services/models/config, tests, CI, and Chrome extension foundation.
Mode: audit and planning only. No app features were implemented in this pass.

## Executive Summary

AI Job Copilot is a broad, portfolio-ready job-search SaaS foundation with strong coverage across resume upload, ATS analysis, curated job discovery, application tracking, AI-generated application content, interview prep, notifications, privacy controls, billing foundations, admin views, public SEO pages, and provider-readiness docs.

The product is not yet SaaS-production-ready. The most important gaps are route protection drift, frontend pages wired to missing backend APIs, mock/provider-ready provider states, local/public file storage, demo/sample metrics that can look real in signed-in dashboards, limited E2E coverage, and incomplete production provider activation.

The live deployment is reachable:

| Check | Result | Evidence |
|---|---:|---|
| Frontend | 200 OK | `https://ai-job-copilot-frontend.vercel.app` returned HTTP 200 from Vercel. |
| Backend health | Live | `/health` returned `success: true`, `status: ok`, service name, uptime, and timestamp. |
| Backend readiness | Ready | `/ready` returned MongoDB connected in `mongodb` mode. |
| Backend provider status | Mixed | AI `mock`, billing `mock`, email `mock`, calendar `mock`, monitoring `noop`. |
| Better Stack | Documented active | `CHANGELOG.md`, `docs/open-beta-launch-execution.md`, and `docs/open-beta-24h-monitoring-plan.md` say Better Stack monitors were manually configured. No Better Stack API verification was available from this workspace. |

## Repository Snapshot

| Item | Result |
|---|---|
| Latest local commit | `b010734 Complete Phase 5: Connected Resume Analysis Workflow with checklist, draft preview, and links` |
| Recent docs/changelog status | Latest changelog entry before this audit is v2.0.10 on 2026-05-25. |
| Remote | `origin https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT.git` |
| Dirty files before audit | `frontend/app/pdf-export/page.tsx`, `frontend/tests/pages.test.tsx`, `frontend/vitest.setup.ts` were already modified. They were not touched by this audit. |
| Frontend route files | 70 `page.tsx` files found. |
| Backend route modules | 15 route modules found under `backend/src/routes`. |
| Extension | Present under `extension/`, Manifest V3, manual visible-page job capture foundation. |

## Feature Inventory

| Area | Current status | Notes |
|---|---|---|
| Public landing, features, pricing, blog, resources, recruiters, contact, about | Working | Public pages render and contain mostly honest beta/provider-ready messaging. Landing has demo preview cards that should remain clearly labeled as samples. |
| Login/register | Mostly working | Email/password flow, rate limiting, password validation, cookie/token refresh foundation, Google provider status toggle. |
| Forgot/reset password | Weak | Pages exist, but UI is not wired to backend mutation flow or email-token persistence. |
| Session persistence | Partially working | Refresh-token cookie and client refresh interceptor exist. Access token is stored in `sessionStorage`, so new-tab behavior still depends on refresh and frontend marker cookie. |
| Resume upload | Working local foundation | PDF/DOCX/TXT allowed. Backend magic-number checks exist. Files still use local public `/uploads` storage. DOCX parsing is fallback quality. |
| Resume ATS analyzer | Working | ATS score, breakdown, job description coverage, anonymize option, suggestions checklist, tailored draft preview, links to PDF/jobs/workflow. |
| Resume builder/versions | Present | Pages and backend version model exist, but workflow integration and high-quality DOCX/PDF export are still basic. |
| PDF/DOCX export | Partially working | Native basic PDF renderer and export history exist. DOCX option appears in UI but backend route only creates PDFs. Route is not protected by middleware. |
| Jobs | Working curated feed | Filters, trust score, salary, source readiness, details, save, match, tailor endpoints exist. Live job-board providers are not configured. Seed jobs use `example.com` apply links. |
| Job details | Working | Public backend route exists, frontend protected route exists. Needs deeper selected-job workflow and real apply URL preservation in tracker. |
| Application kit | Partially working | Generates and persists application kit through `/ai/generate-application-kit`. `/application-kit/[jobId]` is only an alias to `/apply-assistant`. No direct "save kit to tracker" action. |
| Application tracker | Working | Kanban statuses, insights, follow-up dates, status history, notifications on stage transitions. Missing apply URL, timeline UI polish, provider-backed reminders. |
| Company research | Broken workflow | Frontend page exists and live route returns 200, but it calls missing `/api/company-research` backend routes/models. |
| Answer vault | Broken workflow | Frontend page exists and live route returns 200, but it calls missing `/api/answer-vault` backend routes/models. |
| Career vault | Broken workflow | Frontend page exists and live route returns 200, but it calls missing `/api/career-vault` backend routes/models. |
| Contacts/CRM | Broken workflow | Frontend page exists and live route returns 200, but it calls missing `/api/contacts` backend route/model. |
| Guided workflow | Static only | Page exists but is public and does not read user resume/job/application state. |
| Career operating system | Missing requested route | `/career-operating-system` returns 404. Dashboard and guided workflow partially cover the concept. |
| Skill roadmap | Alias mismatch | `/skill-gap` and `/learning-roadmap` exist; `/skill-roadmap` returns 404. |
| Interview prep | Alias mismatch | `/interviews`, `/interviews/mock`, `/interviews/history` exist; `/interview-prep` returns 404. |
| Portfolio generator | Partially working | Generates portfolios, publish/unpublish, public `/u/[slug]`, JSON export. PDF export requires manual ID on `/pdf-export`. |
| GitHub analyzer | Partially working | Strong manual input UI and checklists. AI call uses protected backend route, while page is public. GitHub API env is documented but not wired in backend env config. |
| LinkedIn optimizer | Partially working | Templates and AI optimizer. Page is public, but AI route requires auth. No LinkedIn API usage. |
| Notifications | Provider-ready | Dashboard notifications are live. Email/calendar toggles store preferences but require provider setup. |
| Privacy/export/delete | Good foundation | Preferences, data export, delete workflow exist. External provider deletion and backup retention remain manual. |
| Billing/pricing | Honest provider-ready | Pricing is public and disabled. Settings billing has mock checkout/demo activation. No real Stripe checkout/webhooks. |
| Admin operations | Present | Admin routes are protected by auth/admin middleware. UI uses common workbench. Needs real role seeding/admin access process, stronger audit browsing, and monitoring wiring. |
| Feedback | Working | Public feedback submissions and admin triage foundations exist. No public issue auto-creation. |
| Chrome extension | Provider-ready | Manual visible-page capture. No restricted scraping by design, but host permissions are broad. |

## Route-By-Route Audit

Live route status was checked with unauthenticated HEAD requests against the deployed frontend. "Actual access" records the live redirect/load behavior observed during the audit.

| Route | Exists | Intended access | Actual access | Load status | Purpose and current features | Missing, weak, UX, error, provider honesty | Priority |
|---|---|---|---|---|---|---|---|
| `/` | Yes | Public | 200 | Loads | Landing, demo preview, FAQs, plans, review-first messaging. | Keep sample scores/jobs clearly labeled; do not let preview imply real user metrics. | P2 |
| `/login` | Yes | Public | 200 | Loads | Email login, Google status toggle, cold-start retry, demo mode. | Demo mode creates a mock token that cannot access real backend data; Google token is passed through query string after callback. | P1 |
| `/register` | Yes | Public | 200 | Loads | Registration, password guide, Google status toggle. | Needs email verification and onboarding handoff. | P1 |
| `/auth/forgot-password` | Yes | Public | Not live-sampled separately | Loads from code | Forgot password page shell. | Not wired to `/api/auth/forgot-password`; no provider-backed reset email. | P1 |
| `/auth/reset-password` | Yes | Public | Not live-sampled separately | Loads from code | Reset form shell. | Not wired to `/api/auth/reset-password`; backend has placeholder reset token behavior. | P1 |
| `/features` | Yes | Public | 200 | Loads | Feature catalog with login-required labels. | Links point to routes that are not all consistently protected or complete. | P2 |
| `/pricing` | Yes | Public | 200 | Loads | Plan comparison, disabled billing CTAs, SaaS disclaimer. | Needs waitlist/contact capture and legal-reviewed billing terms before launch. | P2 |
| `/feedback` | Yes | Public | 200 | Loads | Public feedback form. | Needs spam/rate-abuse hardening and support SLA copy. | P2 |
| `/blog` | Yes | Public | 200 | Loads | Static SEO guide cards. | Needs full article pages or honest "guide card" label if no long-form content. | P3 |
| `/resources` | Yes | Public | 200 | Loads | Static resource hub and templates. | Some links target protected pages; labels mostly clear but should be regression-tested. | P3 |
| `/recruiters` | Yes | Public | 200 | Loads | Recruiter portal roadmap with disabled interest form and privacy commitments. | Interest form is not wired, which is honest; add waitlist only after privacy/legal review. | P3 |
| `/contact` | Yes | Public | 200 | Loads | Support/security/feedback contact cards. | Uses a personal email address; SaaS launch needs support domain and privacy/security intake process. | P2 |
| `/about` | Yes | Public | 200 | Loads | Product story, timeline, disclaimers. | Some phase-based wording is historical; future work should be issue/sprint based. | P3 |
| `/dashboard` | Yes | Protected | 307 to `/login` | Redirect OK | Career dashboard with metrics, daily jobs, next actions. | Backend analytics defaults average ATS score to 82 and weekly chart to 1..7 when no data; this can look like fake real metrics. | P0 |
| `/onboarding` | Yes | Protected | Not sampled | Code protected | Multi-step profile setup. | Needs stronger first-run completion gating and resume/job preference handoff. | P2 |
| `/resume/upload` | Yes | Protected | 307 to `/login` | Redirect OK | File upload, guide, anonymized preview, parsed edits. | Local public storage remains; DOCX parser is fallback quality; S3/R2 not wired. | P0 |
| `/resume/analyzer` | Yes | Protected | 307 to `/login` | Redirect OK | ATS analysis, breakdown, suggestions, draft preview, workflow links. | Applying checked suggestions does not pass selected suggestion IDs; improve call applies generic tailoring. | P1 |
| `/resume/builder` | Yes | Protected via `/resume` prefix | Not sampled | Code protected | Resume builder route exists. | Needs deeper version comparison and export quality verification. | P2 |
| `/resume/versions` | Yes | Protected via `/resume` prefix | Not sampled | Code protected | Resume versions route exists. | Needs compare original vs improved and version history UX. | P2 |
| `/pdf-export` | Yes | Should be protected | 200 public | Loads publicly, then client API requires auth | Export PDFs for resume, tailored resume, application kit, portfolio, interview prep. | Middleware misses `/pdf-export`; UI shows DOCX option but backend generates PDFs only; generated files served from public local `/uploads/exports`. | P0 |
| `/jobs` | Yes | Protected | 307 to `/login` | Redirect OK | Search, filters, trust scores, source notice, cards. | Backend list/details are public; sample jobs use `example.com`; source badge can imply live for provider names if sourceType is external. | P1 |
| `/jobs/[jobId]` | Yes | Protected via `/jobs` | Not sampled | Code protected | Job detail route. | Needs complete selected-job workflow and apply URL preservation. | P1 |
| `/jobs/[jobId]/tailor-resume` | Yes | Protected via `/jobs` | Not sampled | Code protected | Tailor resume for job route. | Needs direct resume version selection and export. | P2 |
| `/guided-workflow` | Yes | Should be protected | 200 public | Loads | Seven static workflow steps. | Middleware misses route; page does not use actual resume/job/application state. | P1 |
| `/application-kit` | No generic page | Protected expected | 404 if generic | Missing | Requested route family. | Only `/application-kit/[jobId]` exists and redirects to `/apply-assistant`. Add canonical page or consistent alias. | P2 |
| `/application-kit/[jobId]` | Yes | Protected expected | 307 to `/apply-assistant?jobId=...` | Alias only | Pre-fills apply assistant job ID. | Middleware misses `/application-kit`; alias should be guarded before redirect. | P1 |
| `/apply-assistant` | Yes | Protected | Not sampled in route list | Code protected | Generates cover letter, HR email, LinkedIn, WhatsApp, referral, salary, HR answers. | Requires raw IDs; no selected job picker, no direct save-to-tracker. | P1 |
| `/applications` | Yes | Protected | 307 to `/login` | Redirect OK | Tracker, Kanban, insights, manual application creation. | Save job does not preserve official apply URL in application record; no reply-to-company assistant in detail UI. | P1 |
| `/tracker` | No | Protected expected | Not sampled | Missing | Requested alias. | Add redirect to `/applications` or public label consistency. | P2 |
| `/company-research` | Frontend yes | Should be protected | 200 public | Loads but client API fails | Manual company research form and salary templates. | No backend route/model mounted; route protection missing; guidance references restricted sites for manual research but no scraping. | P0 |
| `/answer-vault` | Frontend yes | Should be protected | 200 public | Loads but client API fails | Personal answer bank UI. | No backend route/model mounted; route protection missing; templates are not connected to company/application context. | P0 |
| `/career-vault` | Frontend yes | Should be protected | 200 public | Loads but client API fails | Source-of-truth career entries. | No backend route/model mounted; route protection missing. | P0 |
| `/career-operating-system` | No | Protected expected | 404 | Missing | Requested route. | Dashboard/guided workflow partially cover concept; route should redirect or exist. | P1 |
| `/interview-prep` | No | Protected expected | 404 | Missing alias | Requested route. | `/interviews` exists; add alias/redirect or nav consistency. | P2 |
| `/interviews` | Yes | Protected via `/interviews` | Not sampled | Code protected | Scheduled interviews, readiness, coach modules. | Needs company/job context handoff and richer stage preparation. | P1 |
| `/interviews/mock` | Yes | Protected via `/interviews` | Not sampled | Code protected | Mock interview practice and scoring. | Needs stronger transcript export and scoring rubric clarity. | P2 |
| `/interviews/history` | Yes | Protected via `/interviews` | Not sampled | Code protected | Interview history. | Needs filters and cross-links to applications. | P3 |
| `/skill-roadmap` | No | Protected expected | 404 | Missing alias | Requested route. | `/skill-gap` and `/learning-roadmap` exist; add alias/redirect. | P2 |
| `/skill-gap` | Yes | Protected | 307 to `/login` | Redirect OK | Skill gap analyzer with 7-day and 30-day plan. | Course APIs are provider-ready only; no saved progress tracker. | P1 |
| `/learning-roadmap` | Yes | Protected? | Not sampled | Not in middleware | Generic FeatureWorkbench using AI skill-gap. | Middleware misses `/learning-roadmap`; may load public then fail on API. | P1 |
| `/portfolio-generator` | Yes | Protected | 307 to `/login` | Redirect OK | Portfolio generation, publish, public slug, JSON. | No direct PDF button; public hosting is same app slug, not custom hosting; output can overstate if user input does. | P1 |
| `/u/[slug]` | Yes | Public | Not sampled | Public profile route | Published portfolio view. | Needs abuse/report controls and privacy review for public data. | P2 |
| `/linkedin-optimizer` | Yes | Should be protected | 200 public | Loads but AI call requires auth | LinkedIn headline/about optimizer, outreach templates. | Route protection missing; no live LinkedIn provider; "3x more responses" copy should be removed or sourced because it is a metric claim. | P0 |
| `/github-analyzer` | Yes | Should be protected | 200 public | Loads but AI call requires auth | Manual project analysis, checklists, bullets, case study. | Route protection missing; backend lacks `/ai/github-analyzer`; `GITHUB_TOKEN` documented but not wired in `env.ts`. | P0 |
| `/contacts` | Frontend yes | Should be protected | 200 public | Loads but client API fails | Recruiter contacts UI. | No backend route/model mounted; route protection missing. | P0 |
| `/settings` | Yes | Protected | 307 to `/login` | Redirect OK | Settings hub. | Account security card is placeholder. | P1 |
| `/settings/integrations` | Yes | Protected | 307 to `/login` | Redirect OK | Provider status UI using `/jobs/sources`. | Missing S3/R2, Calendar, GitHub, Sentry, Better Stack, course APIs; env naming mismatch in docs. | P1 |
| `/settings/notifications` | Yes | Protected | 307 to `/login` | Redirect OK | Preferences for job alerts, follow-ups, interviews, channels. | Email/calendar toggles are preferences only until providers are configured; no visible provider disable guard. | P2 |
| `/settings/privacy` | Yes | Protected | Not sampled | Code protected | Privacy preferences, JSON export, account deletion. | External provider/backups deletion remains manual. | P1 |
| `/settings/billing` | Yes | Protected | Not sampled | Code protected | Mock billing, usage, checkout foundation. | Demo activation can make premium capabilities look active; label strongly as mock. | P2 |
| `/notifications` | Yes | Protected? | Not sampled | Not in middleware | Notification center route exists. | Middleware misses `/notifications`; should be protected. | P1 |
| `/profile` | Yes | Protected | Not sampled | Code protected | Profile management. | Needs session/account security links and onboarding status. | P2 |
| Admin routes | Yes | Protected admin | 307 to `/login` unauthenticated | Redirect OK | Dashboard, users, feedback, jobs, health, monitoring, audit logs, risk, usage, AI usage. | Needs clear admin seed/access process; live admin verification not performed without credentials. | P1 |

## Authentication Audit

What works:

- Login/register backend routes exist with Zod validation, bcrypt, access and refresh JWTs, httpOnly cookies, refresh token rotation, account lock after repeated failures, and auth rate limiting.
- Frontend has password guidance and validation aligned with backend.
- Frontend API client retries a failed non-auth request once through `/auth/refresh`.
- Protected middleware correctly redirects many core app/admin routes.
- Google OAuth routes and provider status endpoint exist and are disabled when credentials are missing.

Weak or missing:

- Access tokens are also stored in `sessionStorage` to support cross-domain auth from Vercel to Render. This avoids `localStorage`, but it is still script-readable and should be treated as XSS-sensitive.
- Google OAuth callback redirects to `/login?googleToken=...`, which exposes a live access token in a URL if Google is configured. Prefer a backend-set httpOnly cookie plus short one-time code exchange or same-site frontend/backend domain strategy.
- Forgot/reset password pages are not wired to working email-token persistence.
- No email verification/account verification after signup.
- No session management UI, device list, revoke-all-sessions, MFA, or login history UI.
- Demo mode sets a mock token client-side; protected pages can load but backend calls will fail. It should be clearly isolated from real authenticated mode or backed by a real demo account.
- Several app pages are missing from the middleware protected route list: `/pdf-export`, `/guided-workflow`, `/company-research`, `/answer-vault`, `/career-vault`, `/contacts`, `/linkedin-optimizer`, `/github-analyzer`, `/learning-roadmap`, `/notifications`, and `/application-kit`.

Priority auth fixes:

- P0: Expand middleware protection to all account/data/AI routes and add route regression tests.
- P0: Remove token-in-query Google callback pattern before enabling real Google OAuth.
- P1: Wire forgot/reset password to signed reset tokens and email provider.
- P1: Add email verification and onboarding after signup.
- P2: Add sessions/devices/security settings UI and MFA provider-ready design.

## Resume Workflow Audit

Flow audited: Resume Upload -> Parser -> Anonymize/redact -> ATS analysis -> Suggestions -> Updated draft -> PDF -> Jobs -> Application workflow.

Working:

- Upload accepts PDF, DOCX, and TXT in UI and backend.
- Backend enforces 5MB limit and validates PDF/DOCX magic numbers plus executable headers.
- Invalid files are unlinked after validation failure.
- PDF text parser uses `pdf-parse`; TXT parser is high quality for text files.
- Anonymized preview and anonymize-for-analysis options redact name, email, phone, and links.
- ATS analyzer combines local heuristic scoring with AI/mock output and job-description keyword coverage.
- Suggestions checklist and tailored draft preview link to PDF export, jobs, and guided workflow.

Missing or weak:

- S3/R2 private object storage is not implemented in runtime code; files are still written to local disk and exposed by `app.use("/uploads", express.static(...))`.
- `fileUrl` is public `/uploads/<filename>`, not a signed private URL.
- Raw extracted resume text is stored in MongoDB; this is useful for features but needs explicit retention, export/delete, and AI privacy controls.
- DOCX parsing uses a binary fallback, not real OOXML text extraction.
- UI guide says PDF/DOCX officially supported while client also allows TXT; docs should be consistent.
- Applying checked ATS suggestions does not pass the selected suggestions to backend; the improve endpoint applies a generic target-role tailoring.
- PDF renderer is basic native PDF and not visually verified. DOCX export appears in UI but backend only supports PDF routes.
- No side-by-side original vs improved diff, one-page checker, recruiter-view preview, or section completeness score beyond the current ATS breakdown.

## Job Discovery Audit

Working:

- `/jobs` has search, workplace, job type, experience, trust, salary, and sort filters.
- Backend supports curated sample jobs, manual import, CSV preview, source readiness, duplicate keys, trust score, scam risk, and save/match/tailor endpoints.
- Job cards show match score, fit skills, missing skills, salary when available, trust score, risk flags, apply link, and application kit link.
- Source readiness page honestly says LinkedIn/Indeed/Naukri/ZipRecruiter/Dice require approved access.

Missing or weak:

- Live job-board APIs are not configured. The deployed backend uses curated/seeded jobs.
- Seed jobs use `https://example.com/apply/...`, which is acceptable for local demo data but must be labeled as sample and not treated as real job data.
- Backend public `/api/jobs` and `/api/jobs/:id` are unauthenticated even though frontend `/jobs` is protected; decide whether public job data is intentional.
- Save-to-tracker creates an application but does not preserve `applyUrl`, salary, job snapshot, source URL, trust score, or selected resume context.
- No saved search alerts, company blacklist, job duplicate UI, provider rate-limit controls, or import-from-URL UX in frontend.
- Browser extension can manually capture visible page text, but production store packaging and host permission tightening are pending.

## Application Kit And Tracker Audit

Working:

- Application kit generation persists `ApplicationKit` records.
- Apply assistant produces cover letter, HR email, LinkedIn, WhatsApp, referral, salary answer, "why hire you", and "tell me about yourself".
- Tracker supports saved/applied/interview/offer/selected/rejected statuses and Kanban status changes.
- Application detail supports rejection analysis.
- Follow-up scheduling exists on backend and notifications are created for important status changes.

Missing or weak:

- `/application-kit/[jobId]` is an alias only; there is no full selected-job kit page.
- Apply assistant requires users to paste IDs rather than choose from saved jobs/resumes.
- No direct "save kit to tracker" button that links `applicationKitId` and `resumeVersionId` to an application.
- Application record does not store official apply URL or immutable job snapshot.
- No reply-to-company assistant for pasted HR/recruiter messages on the application detail page.
- Salary templates are split into company research and application kit output rather than connected to selected company/job context.
- Email/Gmail/Calendar integrations are provider-ready only.

## Company Research Audit

Current status: frontend exists, backend missing.

Working:

- Page has manual company fields: company name, industry, tech stack, rating, salary min/max, career page URL, culture, interview process, notes/recent news/red flags.
- Salary templates include current CTC reveal, expected CTC without disclosure, negotiation after offer, and defer salary discussion.
- The page says research should be manual and public-source based. No restricted scraping exists in code.

Broken/missing:

- No `/api/company-research` route is mounted.
- No company research model/service exists.
- Route is public in middleware and live returns 200, so users can reach a page that fails once client API calls run.
- No connection to job details, application kit, interview prep, or tracker.

Priority: P0.

## Answer Vault, Salary, And Interview Audit

Answer vault:

- Frontend exists with categories, tags, copy button, and truthful-practice disclaimer.
- Backend route/model is missing, so it fails on load/save.
- Route protection is missing.

Salary templates:

- Required templates are present on `/company-research`.
- They are static, copyable, and not connected to company/job context.
- Placeholders are not editable inline before copy.

Interview:

- `/interviews`, `/interviews/mock`, and `/interviews/history` exist.
- Backend has interview readiness, history, question bank, coach, sessions, and mock endpoints.
- Requested `/interview-prep` route is missing; add alias to `/interviews` or a dedicated page.

## Career Operating System Audit

Working:

- `/dashboard` connects profile, analytics overview, daily feed, resume actions, jobs, applications, interviews, skill gaps, and mentor.
- `/analytics` shows funnel metrics, health score, next actions, status charts, source charts, missing skills, and weekly activity.
- `/guided-workflow` explains the path from resume upload to offer.

Weak:

- `/career-operating-system` route is missing.
- `/guided-workflow` is static and public; it should become a stateful checklist.
- Dashboard/analytics contain default/sample values when no data exists: average ATS score defaults to 82 and weekly chart defaults to 1..7 applications. This violates the "no fake metrics" standard for authenticated dashboards.
- No daily career checklist, weekly sprint tracker, open tasks, next-best-action engine, goal tracking, or 7-day sprint execution state.

Priority: P0 for removing fake-looking default metrics; P1 for connected workflow state.

## Portfolio, GitHub, And LinkedIn Audit

Portfolio:

- Protected route, generator, publish/unpublish, public slug, privacy controls, JSON export, and backend public profile exist.
- Missing direct portfolio PDF export button, abuse/report handling, custom hosting/subdomain provider readiness, and stronger public privacy review.

GitHub analyzer:

- Manual project form, README/code/deployment checklists, AI output sections, copy actions, and links exist.
- Page is public while backend AI route requires auth.
- Frontend calls `/ai/github-analyzer`, but backend `ai.routes.ts` does not define that route. This is a functional break.
- `GITHUB_TOKEN` is referenced in UI/docs but not present in `backend/src/config/env.ts` or `backend/.env.example`.

LinkedIn optimizer:

- Manual profile optimizer and connection templates exist.
- Page is public while backend AI route requires auth.
- No live LinkedIn API integration, which is correctly provider-ready only.
- Copy says "Personalised messages get 3x more responses." This is a metric claim and should be removed unless backed by a real cited source.

## Provider Integration Audit

Provider status is based on deployed `/ready` and `/status`, source code, env examples, and docs. No secret values were inspected or exposed.

| Provider | Classification | Env vars required | Configure in | Feature dependency | Current user-facing status | Risk | Next setup step | Verification step |
|---|---|---|---|---|---|---|---|---|
| MongoDB Atlas | Live | `MONGO_URI` | Render backend | Users, resumes, jobs, applications, interviews, settings | Backend `/ready` reports `database.connected: true`, `mode: mongodb` | Docs sometimes say `MONGODB_URI`, causing setup mismatch | Standardize docs/env name or support both aliases | `/ready` and CRUD smoke test |
| OpenAI/Gemini | Mock/Fallback | `OPENAI_API_KEY`, `GEMINI_API_KEY`, `AI_PROVIDER`, `AI_MODEL` | Render backend | ATS AI, kits, interviews, mentor, skill gaps, portfolio, LinkedIn | Backend reports `provider: mock`, fallback enabled | Users may think AI is live if UI copy is loose | Configure one provider with budget limits and redaction review | `/api/ai/status` after login shows provider configured; sample AI call logs non-mock status |
| S3/R2 storage | Provider-ready, not configured | `STORAGE_PROVIDER`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Render backend | Resume/PDF private storage | Docs mention provider-ready; runtime still local `/uploads` | Public resume/PDF URLs and ephemeral Render storage | Add storage service, private bucket, signed URLs | Upload resume, confirm private object and signed download |
| Email/SendGrid/SMTP | Mock/Fallback | `EMAIL_PROVIDER`, `SENDGRID_API_KEY`, `SMTP_*`, `EMAIL_FROM` | Render backend | Password reset, follow-ups, notifications | Backend reports email mock | Reset/reminder messages do not send | Choose SendGrid/Resend/SMTP and wire real send path | Forgot password email received in test inbox |
| Gmail OAuth | Not configured | Gmail/Google OAuth scopes not currently modeled separately | Render backend and Google Cloud | User email workflows | Not surfaced as live | Sending mail via Gmail without consent would be risky | Design OAuth consent and user-reviewed sending | OAuth connection test and explicit draft send confirmation |
| Google OAuth | Provider-ready | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `CLIENT_URL` | Render backend, Google Cloud | One-click sign in | Dynamic disabled/enabled UI | Token-in-query callback pattern is unsafe before live activation | Replace callback token transport, configure credentials | Login with Google on live domain and inspect no token in URL |
| Google Calendar | Mock/Fallback | `CALENDAR_PROVIDER`, `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET` | Render backend, Google Cloud | Interview reminders | Notification page says provider-ready | Toggles can imply active calendar sends | Add OAuth consent and event creation behind user action | Create test interview reminder event |
| Stripe | Mock/Fallback | `BILLING_PROVIDER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PREMIUM` | Render backend, Stripe, Vercel frontend public key if needed | Billing, checkout, subscriptions, usage limits | Pricing disabled; settings has mock checkout/demo activation | Mock activation can be mistaken for paid state | Add Stripe SDK, hosted checkout, webhook verification, legal terms | Test mode checkout -> webhook -> subscription state |
| LinkedIn | Provider-ready | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | Render backend, LinkedIn developer portal | OAuth/profile import, future jobs | Marked provider-ready, no scraping | Approval required; TOS risk | Apply for approved scopes/API | Provider status shows configured and manual OAuth import works |
| Indeed | Provider-ready | `INDEED_API_KEY` | Render backend | Job feed | Provider-ready only | Partner/API approval and rate limits | Obtain approved feed/API credentials | `/jobs/sources` configured plus import smoke test |
| Naukri | Provider-ready | `NAUKRI_API_KEY` | Render backend | India job feed | Provider-ready only | Partner access required; scraping prohibited | Obtain approved partner access | Source import smoke test |
| Dice | Provider-ready | `DICE_API_KEY` | Render backend | Tech jobs | Provider-ready only | Partner/API access required | Obtain approved credentials | Source import smoke test |
| ZipRecruiter | Provider-ready | `ZIPRECRUITER_API_KEY` | Render backend | Job feed | Provider-ready only | API terms/rate limits | Obtain API credentials | Source import smoke test |
| GitHub API | Not configured | `GITHUB_TOKEN` or GitHub OAuth vars | Render backend | Repo analyzer metadata | UI claims provider-ready but backend env/config missing | Frontend route currently calls missing backend endpoint | Add env keys and backend service/route | Analyze public repo metadata without scraping |
| Sentry | Not configured | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `MONITORING_PROVIDER=sentry` | Render and Vercel | Error monitoring | Backend status reports monitoring noop | Production errors lack external alerting | Wire SDK with redaction rules | Trigger test error in staging and verify event |
| Better Stack/Uptime | Needs manual setup verification | External monitor dashboard, no app secret | Better Stack dashboard | Uptime/cold-start monitoring | Docs say active; backend provider status is noop because this is external | No API proof in repo; cold-start false positives | Keep monitors and add status runbook screenshot/log reference outside secrets | Confirm Better Stack dashboard green manually |
| Course APIs | Not configured | `COURSE_PROVIDER`, `COURSERA_API_KEY`, `UDEMY_CLIENT_ID`, `UDEMY_CLIENT_SECRET` | Render backend | Skill roadmap resources | Mostly static/mock | Recommendation freshness and affiliate/legal risk | Add approved course provider abstraction | Skill roadmap returns provider-labeled resources |
| Redis/BullMQ | Provider-ready | `REDIS_URL` | Render/Redis provider | Queues/background jobs | Queue fallback exists | Long AI/PDF tasks are synchronous | Configure Redis and worker process | Job status endpoint and retry test |
| Cloudinary | Not configured/legacy | `CLOUDINARY_*` | Render backend | File/media storage if chosen | Env exists, not central to current storage path | Confusion with S3/R2 plan | Decide storage provider and remove ambiguity | Storage status page shows one canonical mode |

## UX, Mobile, And Accessibility Audit

Strengths:

- Most pages use semantic headings, labels, `role="alert"` for errors, and loading/empty states.
- Public pages avoid fake testimonials and direct job guarantees.
- App shell has a desktop sidebar and mobile bottom nav.
- Forms generally show clear disabled/loading states.

Weaknesses:

- Mobile bottom nav only exposes the first five app routes; many tools have no mobile navigation path without remembering URLs.
- Several app pages are public but fail on API actions. Users will see confusing auth/API errors instead of a login redirect.
- Many advanced tools require raw IDs rather than entity pickers.
- FeatureWorkbench displays raw JSON output, which is useful for demos but not SaaS-level UX.
- Export/apply/company/answer/career vault flows need stronger success states, copyable sections, editable placeholders, and linked next actions.
- Button copy sometimes says "Live" based only on env config presence. Use `Configured`, `Provider-ready`, `Mock/Fallback`, and `Verified live` separately.
- Some text contains mojibake characters in rendered strings, likely from previous encoding issues. This affects polish and trust.

## Security And Privacy Audit

Strengths:

- Helmet, CORS allowlist, x-powered-by disabled, request IDs, rate limiting, auth rate limiting, validation middleware, and upload magic-number checks exist.
- Logger redacts common sensitive fields and emails.
- Audit logging records sensitive API operations without raw request bodies.
- Refresh tokens are httpOnly cookies and hashed in DB.
- AI request logs avoid raw prompt storage.

Risks:

- Local uploads and exports are served publicly from `/uploads`; resume files and generated PDFs should be private.
- Access token is stored in `sessionStorage`, increasing XSS blast radius.
- Google OAuth token-in-query pattern must be fixed before live activation.
- Missing route protection exposes account/AI tool pages publicly, even though APIs still require auth.
- No CSRF protection beyond SameSite cookie strategy; cross-site deployment with `SameSite=None` in production should be reviewed.
- No object storage delete flow for uploaded files because storage is local.
- No dependency security gate beyond advisory report; `npm audit` continues on error in security workflow.
- Extension requests `host_permissions` for all HTTP/HTTPS pages and content script runs on all pages; this should be tightened or explained for privacy.
- Public contact page uses a personal email for support/security.

## Performance And Reliability Audit

Strengths:

- Static public pages are server-rendered.
- Backend health/ready/status endpoints are small and no-store.
- React Query is used for data fetching, and job GETs get short private cache headers.
- Render cold-start UX has frontend messaging and retry.

Risks:

- AI, PDF export, resume parsing, reminders, and imports are synchronous; no user-visible background job status.
- Redis/BullMQ foundation exists but is not active without `REDIS_URL` and worker execution.
- Render local disk is ephemeral, so uploaded/exported files can disappear after redeploy/restart.
- No provider-backed error monitoring; backend monitoring is `noop`.
- Better Stack monitors are documented but not programmatically visible in the app.
- No frontend performance budgets, Lighthouse CI, or visual regression.

## Testing And CI Audit

Current coverage:

- Backend API tests exist and cover auth, upload hardening, jobs, tailoring, interview prep, provider status, billing mock, Google missing credentials, and more.
- Frontend unit tests exist under Vitest/jsdom.
- Extension parser tests exist.
- Playwright smoke spec exists but `@playwright/test` is not installed; the runner intentionally skips if missing.
- CI runs docs, security safety, build, unit tests, and skip-safe E2E.

Gaps:

- No active Playwright dependency/browser install in CI, so E2E can pass while browser coverage is skipped.
- E2E only covers public pages and basic redirect/admin protection.
- No E2E for signup/login persistence, resume upload/analyzer, PDF export, jobs, company research, application kit, tracker, or settings integrations.
- No axe/accessibility automation.
- No visual regression for mobile layout.
- No test asserting all app pages that call protected APIs are middleware-protected.

## Business And SaaS Realism Audit

Realistic now:

- Honest beta positioning, no auto-apply, no guaranteed jobs/interviews, provider-ready labels, feedback intake, pricing disabled, privacy and terms pages, admin operations, audit logs, and release/runbook docs.

Still not production SaaS:

- No real billing, payment terms, taxes, invoices, refunds, or cancellation flow.
- No email verification/reset delivery.
- No private file storage.
- No active external error monitoring.
- No live job provider integrations.
- No legal-reviewed privacy policy/terms for paid SaaS.
- No real user analytics/product event provider.
- No real support queue or SLA.

## Top Critical Issues

1. P0: Remove fake-looking default metrics from authenticated analytics/dashboard (`averageAtsScore: 82`, weekly chart 1..7).
2. P0: Protect all app routes that call private/protected APIs.
3. P0: Fix frontend pages wired to missing backend routes: company research, answer vault, career vault, contacts.
4. P0: Fix GitHub analyzer backend route mismatch (`/ai/github-analyzer` missing).
5. P0: Move resume/PDF storage from public local `/uploads` to private S3/R2 with signed URLs.
6. P0: Fix Google OAuth token-in-query callback before enabling credentials.
7. P1: Replace raw-ID workflows with selected job/resume/application pickers.
8. P1: Preserve official apply URL and job snapshot when saving to tracker.
9. P1: Wire forgot/reset password to email provider and token persistence.
10. P1: Activate real Playwright E2E in CI instead of skip-safe placeholder.

## Overall Recommendation

Treat the next implementation work as a stabilization sprint, not another broad feature expansion. The product already has breadth. The next value comes from making the existing workflows truthful, connected, protected, and verifiable:

1. Fix route/API mismatches and route protection.
2. Remove fake-looking dashboard defaults.
3. Make resume/PDF storage private.
4. Connect company/answer/career/contact workflows to real backend models.
5. Add active E2E tests around the complete resume -> jobs -> kit -> tracker journey.
