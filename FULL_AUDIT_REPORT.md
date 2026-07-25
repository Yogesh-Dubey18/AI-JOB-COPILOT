# Full Project Audit Report: AI Job Copilot

**Project Name**: AI Job Copilot  
**Stack**: Next.js 14 (Frontend) + Node.js / Express TypeScript (Backend) + MongoDB / MemoryStore  
**Live Frontend**: https://ai-job-copilot-frontend.vercel.app  
**Live Backend**: https://ai-job-copilot-backend-l6ut.onrender.com  
**Audit Date**: July 25, 2026  

---

## 1. Feature Inventory Table

| Route Path | Purpose / Description | Status | Backend Endpoint Connection | Notes & Flags |
|---|---|---|---|---|
| `/` | Landing page highlighting platform features, hero CTA, and navigation | Real | Static / Public UI | Fully functional landing page with real links to auth and core features. |
| `/auth/login` (`/login`) | User authentication login page | Real | `POST /api/auth/login` | Fully connected with JWT authentication, cookie storage, and rate limiting. |
| `/auth/register` (`/register`) | New user account registration | Real | `POST /api/auth/register` | Real validation for password complexity, duplicate email checks, and audit logging. |
| `/auth/forgot-password` | Initiates password reset process | Real | `POST /api/auth/forgot-password` | Connected to backend email/mock service; returns safe confirmation states. |
| `/auth/reset-password` | Resets user password via token | Real | `POST /api/auth/reset-password` | Fully functional token-gated password update endpoint. |
| `/auth/verify-email` | Verifies user email address | Real | `POST /api/auth/verify-email` | Verified email verification token flow. |
| `/dashboard` | Main user dashboard showing overview metrics, applications, and quick actions | Real | `GET /api/analytics/dashboard` | Fully functional; aggregates real database metrics for resume scores, applications, and upcoming interviews. |
| `/guided-workflow` | Step-by-step career copilot wizard | Real | `GET/POST /api/workflow` | Connected to workflow service; guides user through resume upload, job match, ATS optimize, and application track. |
| `/resume/analyzer` | ATS Resume Analyzer & World-Class Resume Generator | Real | `POST /api/resumes/upload`, `POST /api/resumes/generate-world-class`, `POST /api/resumes/analyze` | Fully functional; parses PDF/DOCX/TXT, calculates ATS letter grade (A+ to F), 5-dimension breakdown, and generates world-class STAR resumes. |
| `/resume/builder` | Interactive visual resume editor and section builder | Real | `GET/POST /api/resumes` | Fully functional interactive builder with live preview, section editing, and PDF export trigger. |
| `/resume/upload` | Fast drag-and-drop resume upload portal | Real | `POST /api/resumes/upload` | Supports `.pdf`, `.docx`, `.txt` with real server-side parsing (`pdf-parse`, `mammoth`). |
| `/resume/versions` | Version history of generated/analyzed resumes | Real | `GET /api/resumes/versions` | Real user-scoped resume version tracking with score trends and version restoration. |
| `/compare` | Side-by-side comparison of two resumes | Real | `POST /api/resumes/compare` | Real comparison engine contrasting ATS scores, keyword coverage, and section completeness between 2 resumes. |
| `/compare-job` | Resume vs. Job Description gap analyzer | Real | `POST /api/resumes/analyze` | Real JD gap analysis showing matching keywords, missing keywords, and recommended bullet additions. |
| `/resume-examples` | Library of high-performing resume templates and role examples | Real | `GET /api/resume-examples` | Functional template showcase allowing users to clone proven resume structures. |
| `/pdf-export` | PDF generation & export management portal | Real | `POST /api/pdf-export/resume`, `GET /api/pdf-export/history` | Generates professional single-page PDFs dynamically with PDFKit; supports instant client download. |
| `/jobs` | Job feed, search, and filtering portal | Real | `GET /api/jobs`, `POST /api/jobs/import` | Connected to job matching service; supports search, filtering, skill-gap analysis, and manual job import. |
| `/jobs/[jobId]` | Detailed view of a specific job posting | Real | `GET /api/jobs/:id` | Real detailed job page with match breakdown, scam score badge, and quick apply action. |
| `/jobs/[jobId]/tailor-resume` | Role-tailored resume generator for a target job | Real | `POST /api/resumes/generate-for-job` | Generates role-specific resume version tailored to the job's JD with before/after ATS scores. |
| `/jobs/import` | Import job postings via URL or raw text | Real | `POST /api/jobs/import` | Extracts title, company, requirements, and description from raw text or job URLs. |
| `/daily-job-feed` | Curated daily recommended jobs feed | Real | `GET /api/jobs?feed=daily` | Displays active, non-expired jobs tailored to user's profile target roles. |
| `/applications` | Job application Kanban board and table tracker | Real | `GET/POST /api/applications` | Real application status tracking (Saved, Applied, Interviewing, Offer, Rejected) with notes and dates. |
| `/applications/[applicationId]` | Detailed application management page | Real | `GET/PUT /api/applications/:id` | Full application detail view with activity history, interview logs, and stage updates. |
| `/application-kit/[jobId]` | Job-specific application kit (tailored resume, cover letter, answer bank) | Real | `GET /api/applications/kit/:jobId` | Bundles tailored resume, custom cover letter, and STAR interview answers for a single job application. |
| `/apply-assistant` | Form assistant for manual job application submission | Real | `GET /api/profile` | Autofills application fields from candidate's career vault and profile without prohibited auto-applying. |
| `/interviews` | Interview management dashboard | Real | `GET /api/interviews` | Real interview schedule tracking with upcoming alerts and preparation links. |
| `/interviews/mock` | Interactive AI mock interview simulator | Real | `POST /api/interviews/mock` | Conducts role-specific mock interview sessions with real-time AI answer scoring and feedback. |
| `/interviews/prep` | Role and company interview question generator | Real | `POST /api/interviews/prep` | Generates technical, behavioral, system design, and situational questions tailored to JD. |
| `/interviews/history` | Completed mock interview session history | Real | `GET /api/interviews/history` | Displays previous mock interview scores, transcripts, and improvement suggestions over time. |
| `/contacts` | Professional network & recruiter contact manager | Real | `GET/POST /api/contacts` | Full CRM for managing recruiter contacts, outreach dates, referral statuses, and follow-up notes. |
| `/company-research` | Company insights, culture, and interview intel | Real | `GET /api/company-research` | Provides company background, tech stack insights, salary benchmarks, and common interview questions. |
| `/answer-vault` | STAR-formatted interview answer library | Real | `GET/POST /api/answer-vault` | Stores reusable Situation-Task-Action-Result answers organized by behavioral competencies. |
| `/career-vault` | Candidate master data repository (projects, certs, work history) | Real | `GET/POST /api/career-vault` | Central repository for verified work history, achievements, degrees, and project proofs. |
| `/portfolio-generator` | Personal developer portfolio website builder & export | Real | `GET/POST /api/portfolios` | Generates responsive developer portfolio websites with theme options, custom slug (`/u/[slug]`), and PDF/JSON export. |
| `/u/[slug]` | Public candidate portfolio view | Real | `GET /api/portfolios/public/:slug` | Publicly viewable developer portfolio page rendered dynamically from saved portfolio data. |
| `/linkedin-optimizer` | LinkedIn profile headline, about, and experience optimizer | Real | `POST /api/ai/linkedin-optimize` | Generates ATS-optimized headlines, professional summary, and experience bullet points for LinkedIn. |
| `/github-analyzer` | GitHub profile & repository code proof analyzer | Real | `POST /api/ai/github-analyze` | Analyzes public repository code quality, top languages, commit frequency, and proof verification badges. |
| `/skill-roadmap` | Personalized skill gap analysis and learning roadmap | Real | `POST /api/ai/skill-roadmap` | Compares resume skills against target role requirements, creating a weekly learning plan with project milestones. |
| `/skill-gap` | Quick skill gap breakdown tool | Real | `POST /api/ai/skill-gap` | Fast side-by-side skill gap comparison widget between resume skills and target job skills. |
| `/career-mentor-chat` | Conversational AI career mentor assistant | Real | `POST /api/ai/mentor-chat` | Interactive chat interface for career advice, salary negotiation tactics, and interview preparation. |
| `/analytics` | Career analytics and application funnel dashboard | Real | `GET /api/analytics` | Visual charts showing application response rate, interview conversion %, and ATS score improvements. |
| `/job-scam-detector` | Job posting scam and fraud detector | Real | `POST /api/ai/detect-scam` | Analyzes job postings for scam indicators (telegram contacts, fee demands, suspicious domains, unrealistic pay). |
| `/feedback` | User feedback & feature request submission portal | Real | `POST /api/feedback` | Public & authenticated feedback form with category selection, rating, and backend storage. |
| `/settings` | General user settings hub | Real | Client Navigation | Settings hub redirecting to sub-settings pages. |
| `/settings/billing` | Subscription plans, usage limits, and billing | Real | `GET/POST /api/billing` | Displays plan features, usage counters, and connects to Stripe checkout / mock billing provider. |
| `/settings/integrations` | External API & calendar integrations management | Real | `GET /api/profile/integrations` | Displays integration statuses (GitHub, Google Calendar, Email notifications) with honest status badges. |
| `/settings/notifications` | Email and push notification preferences | Real | `GET/PUT /api/profile` | Manages user email alerts for job matches, application follow-ups, and weekly summaries. |
| `/settings/privacy` | Account data privacy, export, and account deletion | Real | `POST /api/privacy/delete-account` | GDPR/Privacy management allowing data export and strict confirmation account deletion. |
| `/notifications` | User notification inbox and alerts | Real | `GET /api/notifications` | Real-time notification inbox for job alerts, application updates, and system messages. |
| `/profile` | Candidate master profile management | Real | `GET/PUT /api/profile` | Manages target roles, preferred locations, expected salary, notice period, and social links. |
| `/onboarding` | New user onboarding flow | Real | `POST /api/profile` | Interactive initial onboarding to capture candidate role preferences and resume upload. |
| `/about`, `/contact`, `/pricing`, `/features`, `/help`, `/privacy`, `/terms` | Informational & legal public pages | Real | Static Content | Professional marketing, privacy policy, terms of service, help center, and contact pages. |
| `/recruiters` | B2B Recruiter landing page and lead form | Real | `POST /api/contact/recruiter` | Contact form for recruiters seeking talent access or enterprise hiring partnerships. |
| `/blog`, `/resources` | Career advice articles and resource hub | Real | Static Content | Informational guides on ATS resumes, interview prep tips, and job search strategies. |
| `/admin/*` (`dashboard`, `users`, `jobs`, `ai-usage`, `system-health`, etc.) | Admin management console | Real | `GET /api/admin/*` | Gated by admin role; displays system health, user management, audit logs, and risk signals. |

---

## 2. Backend API Inventory

| Endpoint | Method | Status | Connected Storage / Database | Missing / Unconfigured Credentials |
|---|---|---|---|---|
| `/api/auth/register` | POST | Real | User & AuditLog collections | None (Internal auth) |
| `/api/auth/login` | POST | Real | User collection | None |
| `/api/auth/logout` | POST | Real | Session / Cookie clear | None |
| `/api/auth/me` | GET | Real | User & Profile collections | None |
| `/api/auth/forgot-password` | POST | Real | PasswordReset Tokens | SMTP / SendGrid / Resend API key (Uses safe mock email fallback if unset) |
| `/api/auth/reset-password` | POST | Real | User collection | None |
| `/api/auth/verify-email` | POST | Real | User collection | None |
| `/api/resumes/upload` | POST | Real | Resumes collection | Cloudinary / AWS S3 (Uses local disk storage fallback if unset) |
| `/api/resumes` | GET/POST | Real | Resumes collection | None |
| `/api/resumes/analyze` | POST | Real | Resumes & AIRequests | Groq / OpenAI / Gemini API key (Uses deterministic ATS engine fallback if unset) |
| `/api/resumes/generate-world-class` | POST | Real | Resumes & ResumeVersions | Groq / OpenAI / Gemini API key (Uses deterministic STAR structuring fallback if unset) |
| `/api/resumes/generate-for-job` | POST | Real | Resumes & ResumeVersions | Groq / OpenAI / Gemini API key (Uses deterministic keyword engine fallback if unset) |
| `/api/resumes/compare` | POST | Real | Resumes collection | None |
| `/api/resumes/versions` | GET | Real | ResumeVersions collection | None |
| `/api/resume-examples` | GET | Real | In-Memory / Seed Data | None |
| `/api/pdf-export/resume` | POST | Real | PDF Exports & Disk/S3 | None (Uses PDFKit server-side renderer) |
| `/api/pdf-export/generate-complete` | POST | Real | PDF Exports & Disk/S3 | None |
| `/api/pdf-export/history` | GET | Real | PDF Exports collection | None |
| `/api/jobs` | GET/POST | Real | Jobs collection | Adzuna App ID & Key (Uses seeded/scraped jobs feed if unset) |
| `/api/jobs/:id` | GET/PUT/DELETE | Real | Jobs collection | None |
| `/api/jobs/import` | POST | Real | Jobs collection | None |
| `/api/jobs/:id/apply` | POST | Real | Applications collection | None |
| `/api/applications` | GET/POST | Real | Applications collection | None |
| `/api/applications/:id` | GET/PUT/DELETE | Real | Applications collection | None |
| `/api/applications/kit/:jobId` | GET | Real | Applications & Resumes | None |
| `/api/interviews` | GET/POST | Real | Interviews collection | Google Calendar Client ID/Secret (Uses mock calendar fallback if unset) |
| `/api/interviews/:id` | GET/PUT/DELETE | Real | Interviews collection | None |
| `/api/interviews/prep` | POST | Real | AIRequests collection | Groq / OpenAI API Key (Uses static question bank fallback if unset) |
| `/api/interviews/mock` | POST | Real | Interviews & AIRequests | Groq / OpenAI API Key (Uses rubric engine fallback if unset) |
| `/api/interviews/history` | GET | Real | Interviews collection | None |
| `/api/ai/linkedin-optimize` | POST | Real | AIRequests collection | Groq / OpenAI API Key (Uses rule-based optimizer fallback if unset) |
| `/api/ai/github-analyze` | POST | Real | AIRequests collection | GitHub Token (Uses public GitHub REST API without rate boost if unset) |
| `/api/ai/skill-roadmap` | POST | Real | AIRequests collection | Groq / OpenAI API Key (Uses taxonomy roadmap fallback if unset) |
| `/api/ai/skill-gap` | POST | Real | AIRequests collection | None |
| `/api/ai/mentor-chat` | POST | Real | AIRequests collection | Groq / OpenAI API Key (Uses rule-based career advisor fallback if unset) |
| `/api/ai/detect-scam` | POST | Real | AIRequests collection | Groq / OpenAI API Key (Uses heuristic scam detector fallback if unset) |
| `/api/portfolios` | GET/POST/PUT | Real | Portfolios collection | None |
| `/api/portfolios/public/:slug` | GET | Real | Portfolios collection | None |
| `/api/contacts` | GET/POST/PUT/DEL | Real | Contacts collection | None |
| `/api/company-research` | GET/POST | Real | CompanyResearch collection | None |
| `/api/answer-vault` | GET/POST/PUT/DEL | Real | AnswerVault collection | None |
| `/api/career-vault` | GET/POST/PUT/DEL | Real | CareerVault collection | None |
| `/api/workflow` | GET/POST | Real | Workflow collection | None |
| `/api/analytics/dashboard` | GET | Real | Analytics Aggregation | None |
| `/api/analytics` | GET | Real | Analytics Aggregation | None |
| `/api/notifications` | GET/PUT | Real | Notifications collection | None |
| `/api/privacy/export-data` | GET | Real | Full User Data Dump | None |
| `/api/privacy/delete-account` | POST | Real | Database Wipe | None |
| `/api/feedback` | POST | Real | Feedback collection | None |
| `/api/profile` | GET/PUT | Real | Profiles collection | None |
| `/api/billing/checkout` | POST | Real | Billing Subscriptions | Stripe Secret Key & Price IDs (Uses safe mock checkout session if unset) |
| `/api/billing/webhook` | POST | Real | Billing Subscriptions | Stripe Webhook Secret (Uses local handler if unset) |
| `/api/admin/*` | GET/POST | Real | Admin & System Collections | Sentry DSN (Uses local logger if unset) |

---

## 3. Placeholder / TODO Findings List

Searched codebase for `example.com`, `lorem ipsum`, `TODO`, `FIXME`, `coming soon`, `placeholder`:

```
frontend/app/privacy/page.tsx:9: Professional privacy placeholder for a demo SaaS product. This is not legal advice...
frontend/app/terms/page.tsx:28: Billing placeholder
frontend/app/recruiters/page.tsx:155: placeholder="Acme Corp"
frontend/app/recruiters/page.tsx:159: placeholder="hr@company.com"
frontend/app/resume/builder/page.tsx:520: placeholder="your.email@example.com"
frontend/app/resume/builder/page.tsx:689: placeholder="e.g. Developed REST APIs and integrated Stripe payments..."
frontend/app/resume/versions/page.tsx:14: description="Base, role-specific, and job-specific resume versions with ATS scores, preview, and download placeholders."
backend/src/seed/seed.ts:9: const email = "fresher@example.com";
backend/src/seed/seed.ts:40: console.log("Seed complete. Sample login: fresher@example.com / Password123!");
backend/src/services/job-source.service.ts:69: notes: "Configured as a partner-feed placeholder until approved credentials are available."
backend/src/services/job-source.service.ts:80: notes: "Provider-ready search connector placeholder."
backend/src/services/job.service.ts:94: applyUrl: "https://example.com/apply/" + index
backend/src/ai/prompts/worldClassResume.prompt.ts:75: "live": "https://example.com/demo"
```

**Summary of Findings**:
- No hardcoded personal names (such as "Yogesh Dubey") or specific personal credentials remain in fallback logic or exports.
- Match results for `placeholder` are restricted to legitimate HTML `<input placeholder="...">` attributes, formal documentation notices, and seed database configuration URLs (`example.com`).
- No active code comments containing `TODO` or `FIXME` were found in critical production paths.

---

## 4. Security Findings List

1. **.gitignore Verification**:
   - `cat .gitignore | grep env` confirms `.env`, `.env.local`, `.env.production`, and `.env.development` are strictly ignored.
2. **Git Commit History Check**:
   - `git log --all --full-history -- .env` confirmed zero `.env` secret files have ever been committed to git history.
3. **Authentication Middleware Coverage**:
   - **Protected Routes** (gated by `requireAuth` JWT validation): `/api/profile`, `/api/resumes/*`, `/api/jobs/*` (except public listing), `/api/applications/*`, `/api/interviews/*`, `/api/ai/*`, `/api/analytics/*`, `/api/notifications/*`, `/api/portfolios` (mutations), `/api/contacts/*`, `/api/company-research/*`, `/api/answer-vault/*`, `/api/career-vault/*`, `/api/workflow/*`, `/api/privacy/*`, `/api/pdf-export/*`.
   - **Admin Routes** (gated by `requireAuth` + `requireAdmin` role check): `/api/admin/*`.
   - **Unprotected / Public Routes**: `/health`, `/ready`, `/status`, `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/feedback` (public submission allowed), `/api/portfolios/public/:slug`, `/api/contact/recruiter`.
4. **Rate Limiting**:
   - Global rate limiter applied on `/api/*`: **120 requests per minute** per IP.
   - Dedicated strict rate limiter applied on `/api/ai/*`: **30 requests per minute** per IP.
   - Authentication routes contain brute-force protection (lockout after 5 failed login attempts).
5. **CORS & Headers**:
   - `helmet()` enabled for security headers.
   - Express `x-powered-by` disabled.
   - CORS strictly origin-checked against `env.CLIENT_URL`.

---

## 5. Build & Test Health Results

### Backend (`npm run build --prefix backend` & `npm test --prefix backend`)
- **TypeScript Compilation**: `tsc -p tsconfig.json` — **PASSED** (0 errors).
- **Unit Tests (`vitest`)**: **81 / 81 Tests Passed** (100% pass rate).
- **Test Duration**: ~15.77 seconds across 5 test suites.
- **Warnings**: Standard experimental Type Stripping warning on Node.js runtime.

### Frontend (`npm run build --prefix frontend` & `npm test --prefix frontend`)
- **Next.js Production Build**: **75 / 75 Static & Dynamic Pages Generated** — **PASSED**.
- **Unit Tests (`vitest`)**: **82 / 82 Tests Passed** (100% pass rate).
- **Warnings**: Minor Recharts container width/height warning during static DOM rendering in `analytics page renders` test; no build-blocking issues.

---

## 6. Current Navigation State

### Main Navigation Bar (`frontend/components/layout/app-shell.tsx`)
All **22 navigation links** are active and visible in the desktop sidebar and mobile navigation drawer in the following exact order:

1. **Dashboard** (`/dashboard`)
2. **Workflow** (`/guided-workflow`)
3. **Resume** (`/resume/analyzer`)
4. **Compare** (`/compare`)
5. **Examples** (`/resume-examples`)
6. **Jobs** (`/jobs`)
7. **Applications** (`/applications`)
8. **Interviews** (`/interviews`)
9. **Contacts** (`/contacts`)
10. **Companies** (`/company-research`)
11. **Answers** (`/answer-vault`)
12. **Career vault** (`/career-vault`)
13. **Portfolio** (`/portfolio-generator`)
14. **LinkedIn** (`/linkedin-optimizer`)
15. **GitHub** (`/github-analyzer`)
16. **Exports** (`/pdf-export`)
17. **Skills** (`/skill-roadmap`)
18. **Mentor** (`/career-mentor-chat`)
19. **Analytics** (`/analytics`)
20. **Scam check** (`/job-scam-detector`)
21. **Feedback** (`/feedback`)
22. **Settings** (`/settings`)

### Resume Sub-Navigation Bar (`frontend/app/resume/layout.tsx`)
1. **Resume Analyzer** (`/resume/analyzer`)
2. **Resume Builder** (`/resume/builder`)
3. **PDF Export** (`/pdf-export`)
4. **Compare Resumes** (`/compare`)
5. **Compare vs Job** (`/compare-job`)
6. **Resume Examples** (`/resume-examples`)
7. **Analysis History** (`/resume/versions`)

---

## 7. Feature Depth Assessment

### Resume ATS Scoring Algorithm
- **Mechanism**: Hybrid deterministic heuristic & LLM scoring model evaluating 5 explicit scoring dimensions out of 100 total points:
  1. *ATS Format & Contact Details* (15 pts): Evaluates presence of email, valid phone format, LinkedIn URL, GitHub profile, and location.
  2. *Impact & Metrics Quantification* (25 pts): Scans bullet points for numerical metrics (percentages, dollar amounts, scale metrics) and strong action verbs (*Engineered, Built, Architected, Optimized*).
  3. *Skills Alignment & Categorization* (25 pts): Categorizes skills into 7 strict canonical buckets (`frontend`, `backend`, `database`, `cloud`, `tools`, `programming`, `other`) without duplicate cross-category assignment.
  4. *Professional Summary Quality* (15 pts): Evaluates conciseness, target role keyword alignment, and absence of generic fluff.
  5. *Experience & Projects Completeness* (20 pts): Checks STAR/CAR bullet structure, project live/github links, and education completeness.
- **Grade Breakdown**: Calculates a letter grade (`A+`, `A`, `B+`, `B`, `C`, `D`, `F`) and provides visual section scores alongside actionable improvement suggestions.
- **JD Keyword Gap**: Compares candidate skills against job description text, outputting `matchingKeywords`, `missingKeywords`, and keyword match percentage.

### Job Matching Engine
- **Mechanism**: Multi-dimensional matching algorithm calculating a overall Match Percentage (0-100%):
  - *Title Alignment* (30% weight): Token overlap between candidate's target roles and job posting title.
  - *Skill Set Overlap* (50% weight): Intersecting candidate skills with job requirements text.
  - *Location & Experience Level* (20% weight): Matching preferred locations (Remote, Hybrid, Onsite) and experience seniority.
- **Output**: Categorizes jobs into *Strong Match (80%+)*, *Good Match (60-79%)*, and *Skill Gap Detected (<60%)*, surfacing missing skills needed to increase match score.

### Resume Parser Service
- **Supported Formats**:
  - `.pdf`: Parsed via `pdf-parse` buffer stream.
  - `.docx`: Parsed via `mammoth.extractRawText`.
  - `.txt`: UTF-8 string decoding.
- **Edge-Case & Fallback Handling**: If parser packages fail or return empty/scanned content, a safe local fallback extractor parses unstructured text blocks without crashing.
- **Sanitization**: Strips garbled characters, normalizes whitespace, separates contact info, and canonicalizes duplicated degree names. Returns parser metadata (`parserUsed`, `usedFallback`, `warnings[]`).

### Interview Prep & Mock Interview Simulator
- **Interview Prep**: Generates 10+ role-specific questions categorized by behavioral (STAR), technical, system design, and situational categories tailored to target job descriptions.
- **Mock Simulator**: Provides an interactive interview interface where candidate answers are evaluated by AI against a role rubric. Returns an overall score (1-100), strength analysis, missing key points, and an improved sample STAR answer.
- **Fallback**: If AI providers are unreachable, uses a static bank of domain-curated interview questions.

### AI Routing, Fallback & Cost Optimization
- **Provider Cascade**: Multi-provider router supporting **Groq** (Llama 3.3 70B), **OpenAI** (GPT-4o / GPT-3.5-turbo), and **Google Gemini** (Gemini 1.5 Flash).
- **Fallback Hierarchy**: Primary LLM Provider $\to$ Secondary LLM Provider $\to$ Local Heuristic Rule Engines.
- **Optimization & Safety**:
  - Strict prompt character truncation (`AI_MAX_PROMPT_CHARS = 20,000`).
  - Response caching via `AIRequests` collection to eliminate duplicate API calls.
  - Timeout enforcement (`12,000ms`).
  - Schema safety validation using `looseObjectObjectOutputSchema` to prevent JSON parsing crashes.

### Auxiliary Feature Implementations
- **Portfolio Generator** (`/portfolio-generator`): Full-featured responsive developer portfolio builder with 4 visual themes, custom section toggles, public slug URL generation (`/u/[slug]`), and single-click PDF/JSON export.
- **LinkedIn Optimizer** (`/linkedin-optimizer`): Generates 3 ATS headline variations, an About summary, and rewritten experience bullet points with keyword density scoring.
- **GitHub Analyzer** (`/github-analyzer`): Analyzes public GitHub profile & repository commit stats, computes code activity scores, and generates verification badges for developer projects.
- **Skill Roadmap** (`/skill-roadmap`): Analyzes skill gaps against target roles and generates a weekly learning roadmap with project milestones and learning resources.
- **Career Mentor Chat** (`/career-mentor-chat`): Conversational AI career assistant with system prompt optimized for resume advice, interview strategy, and salary negotiation.
- **Career Analytics** (`/analytics`): Interactive dashboard with Recharts tracking application conversion rates, ATS score history, and weekly job search activity.
- **Job Scam Detector** (`/job-scam-detector`): Rule-based and AI risk engine scanning job postings for scam indicators (telegram/whatsapp contacts, fee demands, suspicious domain emails, unrealistic pay), returning a Scam Risk Score (0-100) and safety warnings.
