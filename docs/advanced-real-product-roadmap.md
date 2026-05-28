# AI Job Copilot — Advanced Real Product Roadmap

> **Version**: v2 Beta+ (post-audit)
> **Last updated**: 2026-05-28
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
| Dynamic portfolio builder privacy controls | Complete |
| Public `/u/[slug]` route with safe unavailable state | Complete |
| Portfolio slug validation and duplicate rejection | Complete |
| Portfolio version history | Complete |
| Project case-study proof mapping | Complete |
| Portfolio storage hardening with private metadata | Complete |
| Public-approved signed proof file links | Complete |
| User-initiated portfolio proof file upload UX | Complete |
| GitHub proof URL parser and manual fallback | Complete |
| GitHub proof confidence badges and public visibility gate | Complete |
| Proof file scanning provider-ready boundary | Complete |
| Custom portfolio domain hosting | Provider-ready only |
| Analytics dashboard | ✅ Complete |
| Career vault | ✅ Complete |
| Career mentor chat | ✅ Complete |
| Skill gap analyzer | ✅ Complete |
| Playwright E2E tests (69 passing) | ✅ Complete |
| SendGrid / SMTP email provider-ready | ✅ Complete |
| S3/R2 storage provider-ready | ✅ Complete |
| Private portfolio file metadata and signed URL readiness | Complete |
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
| Public/private portfolio status controls | Complete |
| Email, phone, resume, roadmap, and social link visibility controls | Complete |
| Slug editor, reserved-word blocking, and duplicate rejection | Complete |
| Portfolio PDF export from builder | Complete |
| Portfolio version save/list/compare/restore | Complete |
| Recruiter-facing project case studies | Complete |
| Skill-to-proof mapping with privacy controls | Complete |
| Proof file upload, visibility update, signed URL refresh, and delete/detach | Complete |
| GitHub proof check action, provider status badge, and no-fake-stats proof summary | Complete |
| Custom-domain hosting | Provider-ready only |

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

## Phase 10: Interactive WYSIWYG Resume Builder (Completed)

| Feature | Status |
|---|---|
| Selection of base resumes and editable field groups | ✅ Complete |
| Reconstructed draft text analysis and live debounced scoring checks | ✅ Complete |
| Integrated Category score gauge, weaknesses alerts, and keyword coverage | ✅ Complete |
| Direct missing keyword injection back into skills listing | ✅ Complete |

## Phase 13: Skill Gap & Learning Roadmap Enhancement (Completed)

| Feature | Status |
|---|---|
| Protected `/skill-roadmap` workspace with empty states and selection controls | ✅ Complete |
| `/skill-gap` alias redirecting to `/skill-roadmap` | ✅ Complete |
| Heuristic and AI skill gap calculation (current, required, missing, priority, and weak skills) | ✅ Complete |
| 7-day revision sprint and 30-day improvement interactive checklists | ✅ Complete |
| Curated fallback resource library honestly labeled with ethical warnings | ✅ Complete |
| Interactive progress updates persisting to the database | ✅ Complete |
| Guided workflow integration (Not started / Gaps identified / Roadmap generated / Practice started) | ✅ Complete |

---

## Planned (Provider-Ready — Needs Credentials)

| Feature | Requires |
|---|---|
| Live LinkedIn job search | LinkedIn partner API approval |
| Live Indeed job feed | Indeed publisher account |
| Live Naukri job feed | Naukri API partner access |
| Gmail OAuth sync (email classification) | Google OAuth + user consent |
| Stripe subscription billing | Stripe account + webhook |
| S3/R2 resume and portfolio proof storage | AWS or Cloudflare R2 credentials, private bucket, signed URL verification |
| Custom portfolio domains | Vercel/DNS provider credentials, ownership checks, and abuse controls |
| Google OAuth login | Google OAuth credentials |
| Live GitHub proof metadata | `GITHUB_TOKEN` or GitHub OAuth credentials, successful metadata verification, and private repo consent rules |
| Live proof file malware scanning | `FILE_SCANNING_PROVIDER`, `FILE_SCANNING_API_KEY`, `FILE_SCANNING_ENDPOINT`, and a successful real scan |
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

Recommended priority update after proof file scanning provider-ready boundary:

1. **Resume compare view** - diff between original and tailored version using changeSummary
2. **Application stage flow chart** - Sankey or funnel chart for CRM analytics
3. **Notification reminders** - email alerts for follow-ups when SendGrid configured
4. **Job CSV batch import** - approved, legally-obtained job list upload
5. **Rate limit documentation** - approved polling limits per provider
6. **GitHub OAuth private repo consent design** - provider-ready only, no private repo access without explicit user consent
7. **Scanner provider activation runbook** - staging-only verification steps before marking malware scanning Live

Previous roadmap order retained below for historical context:

1. **Resume compare view** — diff between original and tailored version using changeSummary
2. **Portfolio storage hardening** - private S3/R2 storage and signed URLs for resume/PDF downloads
3. **Application stage flow chart** — Sankey or funnel chart for CRM analytics
4. **Notification reminders** — email alerts for follow-ups when SendGrid configured
5. **Job CSV batch import** — approved, legally-obtained job list upload
6. **Rate limit documentation** — approved polling limits per provider

---

*This roadmap is an internal planning document. All timelines are estimates. No guaranteed outcomes.*
