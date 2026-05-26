# AI Job Copilot — Advanced Real Product Roadmap

> **Version**: v2 Beta+ (post-audit)
> **Last updated**: 2026-05-26
> **Principle**: Every feature must be honest, user-controlled, compliant, and production-safe. No fake metrics. No auto-apply. No scraping.

---

## Completed (Foundation)

| Feature | Status |
|---|---|
| Auth (JWT + Google OAuth provider-ready) | ✅ Complete |
| Resume upload + PDF parsing | ✅ Complete |
| ATS scoring v1 (heuristic) | ✅ Complete |
| Resume version history | ✅ Complete |
| Job feed with manual import | ✅ Complete |
| Job deduplication by title/company/location | ✅ Complete |
| Job trust score + scam detector | ✅ Complete |
| Application tracker (Kanban + timeline) | ✅ Complete |
| Apply kit generator (cover letter, HR email, etc.) | ✅ Complete |
| Interview prep + mock interview | ✅ Complete |
| Answer vault + salary templates | ✅ Complete |
| Company research | ✅ Complete |
| Portfolio generator + public slug | ✅ Complete |
| Analytics dashboard | ✅ Complete |
| Career vault | ✅ Complete |
| Career mentor chat | ✅ Complete |
| Skill gap analyzer | ✅ Complete |
| Playwright E2E tests (69 passing) | ✅ Complete |
| SendGrid / SMTP email provider-ready | ✅ Complete |
| S3/R2 storage provider-ready | ✅ Complete |
| Provider status and integrations page | ✅ Complete |
| Privacy controls + audit log | ✅ Complete |
| PDF export (resume + portfolio) | ✅ Complete |
| Admin panel | ✅ Complete |

---

## Phase 2: Advanced Resume Scoring Engine (Completed)

| Feature | Status |
|---|---|
| 5-category ATS scoring (Content, Format, Optimization, BestPractices, Readiness) | ✅ Complete |
| "Why this score" explanation per category | ✅ Complete |
| Quantified bullet detection | ✅ Complete |
| Expanded role keyword banks (Python, DevOps, Data) | ✅ Complete |
| Best practices score (LinkedIn, GitHub, professional email) | ✅ Complete |
| Application readiness score | ✅ Complete |
| Full backward compatibility with existing UI | ✅ Complete |

---

## Phase 3: Resume Schema Enhancement (Completed)

| Feature | Status |
|---|---|
| sourceType field (uploaded/generated/tailored/edited) | ✅ Complete |
| template field (standard/modern/minimal/compact) | ✅ Complete |
| changeSummary (addedSkills, removedSkills, summaryChanged) | ✅ Complete |
| categoryScores + scoreExplanation in ResumeAnalysis | ✅ Complete |

---

## Phase 7: Portfolio SEO (Completed)

| Feature | Status |
|---|---|
| og:title, og:description, og:type for public portfolio | ✅ Complete |
| Canonical URL for public portfolio slugs | ✅ Complete |
| Twitter card metadata | ✅ Complete |
| Server-side metadata with graceful fallback | ✅ Complete |

---

## Phase 9: Multi-Agent Career Orchestration (Completed)

| Feature | Status |
|---|---|
| 10 named agent cards (Profile, Resume, ATS, Jobs, Apply Kit, CRM, Interview, Answers, Portfolio, Research) | ✅ Complete |
| Agent status: complete / in_progress / pending / blocked | ✅ Complete |
| Next-best-action engine (prioritized, deterministic) | ✅ Complete |
| Urgency tiers: critical / high / medium / low | ✅ Complete |
| /api/workflow/next-best-actions endpoint | ✅ Complete |
| Guided workflow page with agent cards and NBA panel | ✅ Complete |
| Overall workflow progress percentage | ✅ Complete |

---

## Planned (Provider-Ready — Needs Credentials)

| Feature | Requires |
|---|---|
| Live LinkedIn job search | LinkedIn partner API approval |
| Live Indeed job feed | Indeed publisher account |
| Live Naukri job feed | Naukri API partner access |
| Gmail OAuth sync (email classification) | Google OAuth + user consent |
| Stripe subscription billing | Stripe account + webhook |
| S3/R2 resume storage | AWS or Cloudflare R2 credentials |
| Google OAuth login | Google OAuth credentials |
| AI-enhanced scoring | OpenAI or Gemini API key |
| Sentry error monitoring | Sentry DSN |

---

## Blocked (Safety and Compliance — Non-Negotiable)

| Feature | Reason Blocked |
|---|---|
| Auto-apply without user review | Violates user trust and platform TOS |
| Scraping LinkedIn/Indeed/Naukri/Glassdoor | Violates TOS and anti-bot protections |
| Residential proxy evasion | Banned technology |
| Anti-detection / WebDriver suppression | Banned technology |
| Auto-fill form fields without user action | Privacy and consent violation |
| Auto-submit application forms | Safety violation |
| Background mailbox access without OAuth consent | Privacy violation |
| Fake testimonials or success stories | Deceptive marketing |
| Guaranteed job/interview claims | False advertising |

---

## Roadmap Priorities (Next)

1. **WYSIWYG resume builder** — inline editing with live ATS score update
2. **Resume compare view** — diff between original and tailored version using changeSummary
3. **Tone selector** — formal/fresher/technical tone for AI-generated cover letters and answers
4. **Application stage flow chart** — Sankey or funnel chart for CRM analytics
5. **Notification reminders** — email alerts for follow-ups when SendGrid configured
6. **Job CSV batch import** — approved, legally-obtained job list upload
7. **Rate limit documentation** — approved polling limits per provider

---

*This roadmap is an internal planning document. All timelines are estimates. No guaranteed outcomes.*
