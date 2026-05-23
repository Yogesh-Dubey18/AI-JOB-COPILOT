# Changelog

All notable changes to AI Job Copilot will be documented here.

## Unreleased

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
