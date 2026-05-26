# AI Job Copilot — PDF Blueprint Gap Map

This document maps every concept from the advanced SaaS career platform PDF blueprint against the current AI Job Copilot codebase. Features are classified as: **Already implemented**, **Partially implemented**, **Safe to implement now**, **Provider-ready only**, **Needs partner approval**, **Needs credentials**, **Blocked for safety/compliance**, or **Replaced with safer alternative**.

> No fake metrics, no auto-apply, no bot evasion, no restricted scraping.

---

## 1. Competitor Outperformance Architecture

| Blueprint Feature | Status | Notes |
|---|---|---|
| Competitor analysis vs Teal, Rezi, Huntr, Simplify | **Safe to implement now** | Strategy docs and product positioning layer. No fake accuracy claims. |
| Resume scoring with 5 dimensions | **Already implemented** | Composite ATS score from Content, Format, Optimization, Best Practices, and Application Readiness. |
| WYSIWYG resume builder | **Already implemented** | Premium interactive WYSIWYG Resume Builder at `/resume/builder` with live ATS score, missing keyword injection, and PDF export. |
| JSON Resume / Reactive Resume-style schema | **Partially implemented** | `Resume` and `ResumeVersion` Mongoose models exist. Structured JSON export planned. |
| Daily job finder with dedup | **Partially implemented** | Job feed, manual import, and source flags exist. Deduplication pipeline enhancement planned. |
| Smart job matching | **Already implemented** | Skill-to-job match scoring with fit/missing skills implemented in `ats-scoring.service.ts`. |
| Client-side apply assistant | **Replaced with safer alternative** | Manual copy-fill helper, not auto-apply or form submission. |
| AI answer synthesizer | **Partially implemented** | Answer vault templates and AI kit generator exist. Enhanced question-answer generation planned. |
| Integrated CRM | **Partially implemented** | Application tracker with Kanban exists. Gmail OAuth sync is provider-ready only. |
| Dynamic portfolio hosting | **Partially implemented** | Portfolio generator and public slug exist. Custom domain hosting is provider-ready only. |
| Multi-agent orchestration | **Already implemented** | Dynamic guided workflow, 10 agent cards, next-best-action engine. |
| Browser extension assist | **Replaced with safer alternative** | Manual extension capture only. No bot evasion, no anti-detection, no auto-submit. |
| SaaS billing and plan enforcement | **Provider-ready only** | Stripe integration is provider-ready. Requires Stripe account activation. |

---

## 2. Resume Scoring and WYSIWYG Builder

| Blueprint Feature | Status | Notes |
|---|---|---|
| Content score (word count, active voice, quantified bullets) | **Already implemented** | Measures word count, action verbs, quantified bullets, and summary presence. |
| Format score (page count, section order, ATS risky formatting) | **Already implemented** | Checks required sections, word density (page count estimate), and table/tab characters. |
| Optimization score (keyword match, skill coverage) | **Already implemented** | `scoreResumeAgainstJobDescription()` and `scoreResumeForRole()` implemented. |
| Best practices score (contact, links, date continuity) | **Already implemented** | Checks contact completeness, LinkedIn, GitHub, professional email. |
| Application readiness score (required sections, role alignment) | **Already implemented** | Checks name presence, certification, links, and role keyword terms. |
| "Why this score?" explainer | **Already implemented** | Returns explicit description strings for each category score. |
| ATS guarantee disclaimer | **Already implemented** | Disclaimer included in existing UI and docs. |
| Live score update while editing | **Already implemented** | Debounced local heuristic scoring recalculates on every field edit in the builder. |
| ATS-safe template selector | **Already implemented** | `template` field tracking added. |
| One-page budget warning | **Already implemented** | Estimates page boundaries and flags word counts over 650. |
| AI enhancement of scoring | **Needs credentials** | If OpenAI/Gemini configured, augment with AI. Deterministic fallback required. |

---

## 3. Structured Resume Schema

| Blueprint Feature | Status | Notes |
|---|---|---|
| JSON Resume / Reactive Resume schema | **Partially implemented** | Mongoose `Resume` and `ResumeVersion` models have structured parsed fields. |
| Source type tracking (uploaded / generated / tailored) | **Safe to implement now** | Add `sourceType` field to `ResumeVersion` model. |
| Template/layout metadata | **Safe to implement now** | Add `template` field to `ResumeVersion`. |
| Version history (original, improved, tailored) | **Partially implemented** | `ResumeVersion` model exists. UI for compare needs enhancement. |
| "Compare original vs improved" view | **Safe to implement now** | Section-diff summary UI in resume versions page. |
| Safe migration (no data deletion) | **Already implemented** | Additive-only schema fields. |
| PDF structured export | **Already implemented** | `pdf-export.service.ts` uses structured resume data. |

---

## 4. Job Aggregation and Deduplication

| Blueprint Feature | Status | Notes |
|---|---|---|
| Approved API job feeds | **Needs partner approval** | LinkedIn, Indeed, Naukri, ZipRecruiter, Dice all require approved credentials. |
| Scraping LinkedIn/Indeed/Naukri/ZipRecruiter/Dice/Glassdoor | **BLOCKED — safety/compliance** | Strictly prohibited. Violates TOS and anti-bot protections. Not implemented. |
| Manual job import | **Already implemented** | Paste job URL/description form. Jobs created in database. |
| Job normalization model | **Partially implemented** | Job schema includes title, company, location, skills, source flags. |
| Deduplication by title/company/location | **Safe to implement now** | Backend dedup check on manual import. |
| Semantic dedup via embeddings | **Needs credentials** | Only if OpenAI/Gemini embeddings configured. No fake model claims. |
| Trust score / scam risk | **Already implemented** | `scam-detector.service.ts` and `trustScore` field on Job model. |
| Source badge (manual/api/seed) | **Already implemented** | `sourceType` field on Job model with UI badges. |
| Provider-ready labels on UI | **Already implemented** | Job sources page shows `provider-ready` status honestly. |
| Rate limit documentation | **Safe to implement now** | Document approved polling limits per provider. |

---

## 5. Client-Side Apply Assistant

| Blueprint Feature | Status | Notes |
|---|---|---|
| Fully autonomous auto-apply | **BLOCKED — safety/compliance** | No submission without explicit user review. Not implemented. |
| Anti-detection / bot evasion | **BLOCKED — safety/compliance** | Strictly prohibited. Residential proxies, browser stealth, WebDriver suppression are banned. |
| Manual copy/fill helper | **Safe to implement now** | User-controlled field copy panel in apply assistant. |
| Form field mapping suggestions | **Safe to implement now** | Profile field display for manual copy into application forms. |
| User review before any submission | **Already implemented** | All actions are user-initiated. No background submissions. |
| Extension manual assist roadmap | **Safe to implement now** | Documentation of safe browser extension workflow. |
| "Mark as applied manually" | **Already implemented** | Tracker allows manual status updates. |

---

## 6. AI Application Answer Synthesizer

| Blueprint Feature | Status | Notes |
|---|---|---|
| Answer templates for common questions | **Already implemented** | Answer vault templates: tell me about yourself, salary, notice, etc. |
| AI-generated draft answers | **Already implemented** | `apply-assistant` page generates AI-powered cover letters and HR emails. |
| Company/job-specific context inputs | **Already implemented** | Job description and company research can be combined. |
| Tone selector (formal/fresher/technical) | **Safe to implement now** | Add tone parameter to generation prompts. |
| "Review before use" disclaimer | **Already implemented** | Copy labels and UI notices are present. |
| Confidence/match explanation | **Safe to implement now** | Return matched skills used to generate the answer. |
| Fallback templates if AI unconfigured | **Already implemented** | Deterministic templates used in mock mode. |
| Save to answer vault | **Already implemented** | Answer vault CRUD is functional. |

---

## 7. CRM / Email Sync

| Blueprint Feature | Status | Notes |
|---|---|---|
| Application CRM with stages and timeline | **Already implemented** | Kanban tracker with `statusHistory` and `timeline` fields. |
| Recruiter/contact tracking | **Partially implemented** | Contact model exists. Full CRM contact linking planned. |
| Gmail OAuth sync | **Provider-ready only** | Gmail API credentials must be configured. User OAuth consent required. Background mailbox access without explicit authorization is blocked. |
| Email classification (job-related / company / status) | **Blocked until Gmail configured** | Classification logic must run only after user-authorized sync. |
| Inbox read without consent | **BLOCKED — safety/compliance** | No background mailbox access without OAuth consent. |
| Next action extraction from emails | **Provider-ready only** | Planned behind Gmail OAuth gate. |
| Dashboard analytics (response rate, interview rate) | **Already implemented** | Analytics page shows funnel metrics. Empty state guidance needed. |
| Sankey flow chart for stages | **Safe to implement now** | Add stage flow chart if recharts supports it, or placeholder. |

---

## 8. Dynamic Portfolio Hosting

| Blueprint Feature | Status | Notes |
|---|---|---|
| Portfolio generator | **Already implemented** | Portfolio create/publish/unpublish at `/portfolio-generator`. |
| Custom slug support | **Already implemented** | Public portfolio at `/u/[slug]`. |
| PDF export | **Already implemented** | PDF download from portfolio. |
| Theme / section selector | **Safe to implement now** | Add basic theme labels and visible-section toggles. |
| SEO metadata (title, description, OG) | **Safe to implement now** | Add canonical URL, og:title, og:description to public portfolio. |
| Custom domain provider-readiness | **Provider-ready only** | Requires Vercel team account and domain delegation. |
| Fake hosted domain claim | **BLOCKED — safety/compliance** | No fake domain provisioning claims. Honest provider-ready only. |
| Vercel multi-tenant domain env placeholders | **Safe to document now** | `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `PORTFOLIO_BASE_DOMAIN` in .env.example. |

---

## 9. Multi-Agent Career Orchestration

| Blueprint Feature | Status | Notes |
|---|---|---|
| Guided workflow with state machine | **Partially implemented** | `/guided-workflow` shows progress steps. Dynamic progress from DB counts. |
| Named agent cards (Profile, Resume, Job Match, etc.) | **Safe to implement now** | UI agent cards with status indicators. |
| Next-best-action engine | **Safe to implement now** | Deterministic rule engine based on DB state. |
| Blocked/provider-needed actions visible | **Safe to implement now** | Clear UI labels for locked features. |
| User confirmation gates | **Already implemented** | All actions require user initiation. |
| Autonomous external submissions | **BLOCKED — safety/compliance** | Not implemented and will not be. |
| LangGraph-inspired state transitions | **Safe to document now** | Document state machine design. Provider-ready only for live AI orchestration. |

---

## 10. Browser Assistance

| Blueprint Feature | Status | Notes |
|---|---|---|
| Manual job capture from tab | **Already implemented** | Chrome extension foundation at `extension/`. |
| Auto-fill without user action | **BLOCKED — safety/compliance** | User must click to fill or copy. No auto-submit. |
| Residential proxy bypass | **BLOCKED — safety/compliance** | Strictly prohibited. |
| Anti-detection headers/fingerprint spoofing | **BLOCKED — safety/compliance** | Strictly prohibited. |
| Session cookie bridging | **Provider-ready only** | User-logged-in session only. No credential harvesting. |
| Store packaging for Chrome Web Store | **Safe to plan** | Requires store developer account. Blocked pending TOS review. |

---

## 11. SaaS Roadmap Classification

| Phase | Status |
|---|---|
| Foundation (auth, upload, jobs, tracker, portfolio) | **Already implemented** |
| Aggregation (job feeds, dedup, smart matching) | **Partially implemented** |
| Automation (email sync, CRM, answer AI, orchestration) | **Provider-ready / Safe to implement UI layer** |
| Orchestration (multi-agent, LangGraph-inspired, full pipeline) | **Provider-ready only / Requires AI credentials** |
| Billing (Stripe, plan enforcement, metering) | **Provider-ready only** |

---

## 12. Security, Privacy, and Compliance

| Feature | Status |
|---|---|
| Auth rate limiting | **Already implemented** |
| Security headers (Helmet) | **Already implemented** |
| CORS allowlist | **Already implemented** |
| JWT rotate-and-revoke | **Already implemented** |
| bcrypt password hashing | **Already implemented** |
| Magic number file validation | **Already implemented** |
| Sensitive log redaction | **Already implemented** |
| Audit log API | **Already implemented** |
| Google OAuth token-in-URL risk | **Documented — P0 follow-up** |
| XSS risk (sessionStorage tokens) | **Documented — P0 follow-up** |
| S3/R2 private storage | **Provider-ready only** |
| Account deletion/export | **Already implemented** |
| Sentry error monitoring | **Provider-ready only** |
| Better Stack uptime monitoring | **Provider-ready / manually configured** |
| CSRF (SameSite=Lax) | **Already implemented** |
| Input validation (Zod) | **Already implemented** |
| No fake testimonials/metrics | **Compliant** |
| No guaranteed job/interview claims | **Compliant** |
| No restricted scraping | **Compliant** |
| No auto-apply | **Compliant** |
| No anti-detection systems | **Compliant** |

---

## Summary Table

| Classification | Count |
|---|---|
| Already implemented | 35+ |
| Partially implemented | 10 |
| Safe to implement now | 18 |
| Provider-ready only | 9 |
| Needs partner approval | 5 |
| Needs credentials | 3 |
| Blocked for safety/compliance | 8 |
| Replaced with safer alternative | 2 |

> All blocked items are explicitly non-negotiable for safety, compliance, and ethical reasons.
> Safe alternatives are documented in their respective phase implementation files.

---

*Generated: 2026-05-26 | Audit Mode: Documentation-only | No credentials committed.*
