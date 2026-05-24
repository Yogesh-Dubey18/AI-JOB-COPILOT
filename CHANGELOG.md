# Changelog

All notable changes to AI Job Copilot will be documented here.

## Unreleased

### v2.0.3 — Open Beta Launch Execution (2026-05-24)

- **Launch documentation**: Created `docs/open-beta-launch-execution.md` containing launch checklists, route HTTP response verification, disclaimers, and rollback procedures.
- **Monitoring plan**: Created `docs/open-beta-24h-monitoring-plan.md` setting up health check intervals, route verification, severity SLAs, and 24h/72h/7d checklists.
- **Feedback intake**: Created `docs/open-beta-feedback-intake-log.md` with template headers to log real user issues (no fake entries).
- **Launch announcements**: Created `docs/open-beta-announcement-final.md` with ready-to-copy social media, WhatsApp, and email pitch templates with appropriate beta limitations and disclaimers.
- **Live verification**: Executed automated live route smoke test, validating HTTP status code responses (200 for public pages, 307 redirect to login for gated pages).

### v2.0.2 — Beta UX Feedback Fix Sprint (2026-05-24)

Real beta tester audit identified 11 UX/copy/navigation issues. All high and medium priority issues are fixed in this release.

- **Fix 1 — Login:** Added "Forgot password?" link below the password field, linking to `/auth/forgot-password`. The route already existed.
- **Fix 2 — Register:** Confirmed Full Name field already present in register mode. No change required. Documented.
- **Fix 3 — Landing:** Replaced 5 duplicate feature comparison card descriptions with unique, honest one-liners per feature (Resume AI, Job matching, Application tracker, Interview preparation, Portfolio generator).
- **Fix 4 — Landing:** Expanded "How it works" cards with descriptions and icons (Upload, BarChart2, Wrench, CheckCircle2). Each step now explains its value.
- **Fix 5 — Landing hero:** Renamed CTA from misleading "Upload resume and see match score" to honest "Start free — upload resume and see your ATS score" which matches the `/register` destination.
- **Fix 6 — Blog:** Fixed salary negotiation guide link from `/company-research` (wrong) to `/resources`. Replaced all "Read guide" labels with honest context-aware labels: "View resource" for static content, "Open tool — login required" for auth-gated features. Added "Beta guide" date label and "AI Job Copilot Team" author attribution to all posts. Added lock icon badge for auth-gated links.
- **Fix 7 — Pricing:** Renamed "Review plan" button to "Get notified when {plan} launches" (disabled; billing is inactive in beta). Added Billing FAQ note explaining no charge, no subscription, and no cancellation required during beta.
- **Fix 8 — Feedback page:** Added page-specific metadata: `title: "Feedback | AI Job Copilot"` and beta-context description. Browser tab now shows the correct page name.
- **Fix 9 — Features:** Updated all "Try it" button labels to "Try it — login required" to clearly signal auth-protected routes before the user clicks. Middleware protection unchanged.
- **Fix 10 — Google OAuth:** Added a disabled, visually distinct "Continue with Google — coming soon" button to the auth form (login and register modes). Includes tooltip and sub-label explaining it is provider-ready and not yet active. No fake OAuth flow added.
- **Fix 11 — Trust signals:** Added honest "Private beta · No auto-apply without your review · Review-first AI" badge to the hero section. No fake tester counts, no fake testimonials, no fake metrics.
- **Tests:** Added assertions for Forgot password link, Full Name field, disabled Google OAuth button in login and register test cases.
- **Docs:** Created `docs/real-beta-feedback-fix-plan.md` with fix status, deferred items, and manual retest checklist.

### v2.0.1-patch — Auth Cold-Start UX Fix (2026-05-24, commit 6505ed8)

- **Fixed:** Login/register form showed confusing `"Demo-safe notice: the backend auth service is currently unavailable. Check NEXT_PUBLIC_API_URL and try again. No credentials were saved here."` during Render free-tier cold start.
- **New:** Friendly `"🔄 Server is waking up…"` message explains the 30–60 second start delay.
- **New:** 30-second auto-retry countdown that automatically re-submits the form after the server wakes up.
- **New:** "Try again now" manual retry button.
- **New:** Background `/health` ping on auth form mount to trigger Render cold-start wake-up before the user clicks Login.
- **Maintained:** "Continue in Demo Mode" fallback for exploring the app without a real account.
- **Removed:** All instances of `NEXT_PUBLIC_API_URL` and `Demo-safe notice` strings from user-facing error messages.
- **Updated test:** `frontend/tests/pages.test.tsx` login submit test updated to account for the `/health` ping fired on mount.

### Issue 23 — SEO Resource Hub (v2 beta)
- Added /blog page with 10 SEO-optimized career guide cards (ATS resume, STAR method, salary negotiation, fullstack roadmap, scam alerts, LinkedIn, React/Node.js/MERN questions, fresher guide, AI workflow).
- Added /resources page with career resource hub: featured guides, 5 category sections, copy-ready templates, and internal CTA links.
- Both pages are static (no API calls), fully server-rendered with Next.js metadata for SEO.
- Added 5 new Vitest tests for blog/resources pages (total 38 passing).

### Issue 24 — GitHub Project Analyzer (v2 beta)
- Added /github-analyzer page with repo URL + manual input form.
- Self-assessment checklists: README quality, code structure, deployment readiness.
- AI-powered resume bullet generation, portfolio case study, interview talking points, improvement suggestions (all provider-ready via /ai/github-analyzer).
- Honest "GitHub API — provider-ready" notice — requires GITHUB_TOKEN in backend .env.
- Links to career vault, portfolio generator, and application kit.
- Added 3 new Vitest tests for GitHub analyzer (total 41 passing).

### Issue 25 — Accessibility and Performance Audit (v2 beta)
- Created docs/accessibility-performance-audit.md: 22 pages reviewed for accessibility, responsive UX, loading/error states, and performance.
- Documented: aria-labels on all icon-only buttons, role="alert" on error states, logical h1/h2/h3 hierarchy, text labels on all status badges.
- Documented: static server components for blog/resources (no client JS), React Query caching, no unnecessary polling.
- Known limitations documented: no Lighthouse CI, no axe-core in CI, mobile device testing recommended.

### Issue 26 — Notification Preferences (v2 beta)
- Added /settings/notifications page with: job match alert controls (enabled/score/frequency), follow-up delay selector, interview reminder timing multi-select, stale application threshold, and channel toggles.
- Connected to existing backend GET/PATCH /api/notifications/preferences endpoints.
- Provider-ready notice for email (SENDGRID_API_KEY) and calendar (GOOGLE_CALENDAR_*) channels.
- Updated settings main page link to point to /settings/notifications.
- Created docs/notification-preferences.md with API reference and channel status table.
- Added 3 new Vitest tests for notification preferences (total 44 passing).

### Issue 27 — Localization Readiness (v2 beta)
- Created frontend/lib/i18n.ts with translation dictionary for English, Hindi, and Hinglish (50+ keys).
- Keys cover: navigation, hero, auth, dashboard, resume, jobs, application kit, tracker stages, provider status, and AI disclaimers.
- Provides t(key, lang) helper with English fallback, getStoredLanguage() and setStoredLanguage() localStorage utilities.
- Created frontend/components/shared/language-selector.tsx — accessible dropdown component.
- Created docs/localization-readiness.md with usage guide, known limitations, and future roadmap.
- Added 8 new Vitest tests for i18n utilities (total 52 passing).

### Issue 28 — Recruiter Portal Readiness (v2 beta)
- Added /recruiters page with: hero + honest beta disclaimer, privacy-first commitments section, 6 recruiter feature cards with roadmap status, 6-phase roadmap, disabled interest form with clear "not live yet" label, candidate safety commitments.
- No fake live recruiter claims anywhere. Submit button is disabled with clear message.
- Created docs/recruiter-portal-roadmap.md covering privacy model, consent model, verification plan, anti-scam plan, backend requirements, and legal review checklist.
- Added 6 new Vitest tests for recruiter portal (total 58 passing).

### Issue 29 — Production Monitoring Readiness (v2 beta)
- Created docs/monitoring-observability-readiness.md covering: backend /health endpoint status, frontend error boundaries, Sentry provider-ready setup instructions (DSN not configured), uptime monitoring recommended tools (UptimeRobot, Better Stack), alerting plan, provider health status table.
- Documented manual smoke-test checklist for every production deploy.
- Known limitations documented: no Sentry DSN, no uptime monitoring, no structured JSON logging.
- No fake monitoring claims — all live vs provider-ready items clearly labelled.

### Issue 30 — Final Real Provider Activation Runbook (v2 beta)
- Created docs/provider-activation-runbook.md: comprehensive 10-provider activation guide.
- Covers: MongoDB Atlas, OpenAI/Gemini, Google OAuth, Stripe, LinkedIn, Indeed, SendGrid, AWS S3, GitHub API, Naukri.
- Includes: backend .env template, step-by-step activation per provider, Vercel env vars table.
- Pre-launch security/backend/frontend/monitoring/legal checklist.
- Emergency rollback plan and provider support contacts.
- No fake "live" claims — all providers clearly marked as provider-ready until credentials are set.

- Added v2 beta gap audit covering 40 feature areas with real status, gaps, and recommended next issues.
- Added provider/integration status UI at /settings/integrations showing live vs provider-ready state for 8 external services.
- Added guided job-search workflow page at /guided-workflow with 7 connected steps and actionable tips.
- Added recruiter CRM contacts page at /contacts with add/list/notes/LinkedIn URL tracking.
- Improved /jobs page with experience level, contract, part-time filters and 15 LPA+ salary tier.
- Improved apply assistant with human-readable section labels, review disclaimer, error handling.
- Expanded about page with 6 value cards, phase development timeline, and honest disclaimer section.
- Updated features page with all 12 features linked to real routes with Try it buttons.
- Added FAQ section to landing page covering 6 common questions.
- Fixed hardcoded 88% AI match badge in job-card — now uses real matchScore from API.
- Added Workflow and Contacts nav items to sidebar.
- Added 4 new frontend tests (total 33 passing).
- Added commercial readiness audit, legal/business templates, pricing disclaimers, and professional placeholder updates for privacy and terms pages.
- Added final recruiter, investor-style, product storytelling, demo, walkthrough, FAQ, and presentation package documentation.
- Added final archive closure, START_HERE navigation, master handoff v2, owner checklist, issue-based roadmap, and stop condition documentation.

## v2.0.0 - 2026-05-21

- Promoted v2 from beta to a stable source, documentation, and architecture release for production deployment preparation.
- Added production environment checklist, deployment verification guide, production smoke test report template, go-live manual, and stable release closure documentation.
- Updated README, final audit, known limitations, documentation index, and release notes with honest live-deployment status.
- Verified the stable release locally before tagging; live production verification remains pending until real URLs and platform access are provided.

## v2.0.0-beta - 2026-05-21

- Added v2 resume parsing, ATS scoring, role keyword banks, job source normalization, trust scoring, and duplicate detection.
- Added v2 application tracker intelligence, notifications, email/calendar-ready foundations, AI copilot guardrails, usage tracking, SaaS billing limits, admin operations, audit logs, auth/security hardening, tests, CI/CD docs, observability, privacy export/delete, public portfolio, advanced analytics, interview coach, PDF exports, Chrome extension foundation, and PWA/mobile offline polish.
- Added v2 beta readiness, testing, manual action, stabilization, and release note documentation.
- Verified local beta build/test flow with backend tests, frontend tests, extension tests, docs checks, security checks, and Git safety checks.

## v1.0.0 - 2026-05-20

- Added safety-first repository checks and placeholder-only environment examples.
- Added deployment, production readiness, and live URL runbooks.
- Added production hardening documentation and provider-ready architecture notes.
- Added SaaS, billing, admin, analytics, recruiter, portfolio, resume, job search, outreach, and interview mastery documentation packages.
- Added repository polish, docs link checks, v2 roadmap, and final handover package.
- Added final deployment execution docs, live URL verification placeholders, and public launch package.
- Added final master index, project operating manual, command center, readiness dashboard, and agent guide.
- Added v1.0.0 release notes, freeze checklist, public launch closure, recruiter handoff summary, and release validation report.

## Notes

- Live deployment URLs are pending until real hosting credentials and project URLs are configured.
- AI, email, billing, calendar, and monitoring providers remain mock/provider-ready unless environment keys are supplied.
