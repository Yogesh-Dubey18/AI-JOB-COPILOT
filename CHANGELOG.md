# Changelog

All notable changes to AI Job Copilot will be documented here.

## Unreleased

### v2.0.33 - User-Initiated Portfolio Proof File Upload UX (2026-05-28)

- **Proof File Upload API**: Added owner-scoped upload, list, visibility update, signed URL refresh, attach, and delete/detach routes for portfolio proof files.
- **File Validation**: Limited proof uploads to PNG, JPG/JPEG, WEBP, and PDF files up to 5MB with MIME, extension, and magic-number validation.
- **Private By Default**: New proof files are private unless the user explicitly marks them `publicApproved`; `/u/[slug]` hides private files completely.
- **Builder Upload UX**: Added proof file upload guidance, attachment target selection, private-by-default status, visibility controls, signed URL/download actions, and delete/detach controls to `/portfolio-generator`.
- **Public Portfolio Safety**: Public portfolios show only public-approved file links and avoid leaking local paths, private bucket URLs, private notes, or internal storage keys.
- **Provider Honesty**: Kept local fallback labeled as non-durable and S3/R2 as provider-ready until real credentials and signed URL behavior are verified. No fake hosted domain or fake proof claims added.

### v2.0.32 - Portfolio Storage Hardening With Signed URL Readiness (2026-05-27)

- **Private File Metadata**: Added owner-scoped portfolio file metadata for resume PDFs, portfolio PDFs, screenshots, proof files, and generated portfolio assets.
- **Storage Key Safety**: Hardened storage-key normalization to reject absolute local paths, bucket URLs, empty segments, and traversal-style keys before issuing links.
- **Signed URL Readiness**: Added honest storage status reporting and signed URL TTL handling with `STORAGE_SIGNED_URL_TTL_SECONDS=900` as the default.
- **PublicApproved Privacy Rule**: Updated public portfolio projection so `/u/[slug]` only returns proof file links when metadata visibility is `publicApproved`.
- **Builder Storage UX**: Added storage status, file privacy labels, signed URL/download status text, and the warning that private files are only shared when approved.
- **Provider Honesty**: Kept local fallback labeled as non-durable and S3/R2 as provider-ready until credentials and bucket access are verified. No fake hosted domain or fake storage Live claim added.

### v2.0.31 - Portfolio Version History & Project Proof Mapping (2026-05-27)

- **Portfolio Version History**: Added owner-scoped save/list/compare/restore endpoints and builder UI for portfolio snapshots with version title, created date, visibility status, and change summary.
- **Safe Restore**: Restoring a version preserves the current slug and keeps current public/private visibility by default to avoid accidental publishing.
- **Project Case Studies**: Added structured case-study editing for problem solved, tech stack, contribution, features, challenges, solution, result/learning, GitHub/live/screenshot links, and proof status.
- **Proof Mapping**: Added skill-to-proof mapping cards tying skills to projects, resume bullets, optional proof links, and confidence labels.
- **Public Privacy Filters**: Updated `/u/[slug]` output to show only public-approved case studies and proof mappings while excluding private proof notes and private mappings.
- **No Fake Proof Policy**: Added user-facing warnings and docs clarifying that proof statuses are owner-maintained and must not imply fake metrics, fake provider verification, or fake testimonials.

### v2.0.30 - Dynamic Portfolio Builder & Public Slugs (2026-05-27)

- **Public Portfolio Slugs**: Implemented `/u/[slug]` as a recruiter-safe public portfolio route with unavailable/private/unpublished handling and privacy-filtered public data.
- **Portfolio Builder Upgrade**: Expanded `/portfolio-generator` with title, headline, about summary, skills, projects, GitHub, LinkedIn, resume PDF URL, visibility controls, slug editor, and public preview link.
- **Slug Safety**: Added backend slug availability checks, reserved-word blocking, validation, and duplicate explicit slug rejection.
- **Privacy Controls**: Kept portfolios private by default and added opt-in visibility for email, phone, resume PDF, roadmap achievements, and social links.
- **Portfolio PDF Export**: Preserved portfolio PDF generation/download and documented local storage fallback versus S3/R2 private storage requirements.
- **Hosting Honesty**: Documented custom-domain hosting as provider-ready only with no fake Vercel domain provisioning claims.

### v2.0.29 — Skill Gap Analyzer & Learning Roadmap (2026-05-27)

- **Skill Gap Analyzer Workspace**: Implemented `/skill-roadmap` protected route performing direct comparisons between resume parsed skills and job required skills.
- **Checklist-Enabled Roadmaps**: Added click-to-toggle 7-day Revision Sprint and 30-day Improvement Curriculum checklists that persist progress updates (0–100%) to the MongoDB backend database.
- **Reference Resource Library**: Integrated a dynamic library of curated reference materials for JavaScript, React, Node.js, Express, MongoDB, SQL, Git/GitHub, Deployment, DSA, System Design, and Interview Prep, clearly labeled as falling back due to unconfigured live course providers.
- **Ethical Verification Banners**: Embedded strict disclaimers reminding candidates to only list skills they can honestly explain, with warning details against faking resume information.
- **Guided Workflow Dynamic Badging**: Configured step 6 of the Guided Workflow to query plans and render real-time progress statuses: Not started, Gaps identified, Roadmap generated, Practice started.
- **Unified Routing Redirects**: Added middleware rule intercepting requests to `/skill-gap` or `/learning-roadmap` and cleanly redirecting them to `/skill-roadmap`.
- **Testing**: Added backend API tests for gap calculation, plan queries, and PATCH updates; added frontend React tests for roadmap page components and checkboxes; added Playwright E2E redirection coverage.

### v2.0.28 — Advanced Interview Preparation & Mock Interview Builder (2026-05-26)

- **10 Interview Prep Modes**: Added HR, Technical, React frontend, Node/Express, MERN full stack, JavaScript basics, Project explanation, Fresher behavioral, Salary discussion, and Assignment discussion modes.
- **Question Bank**: 5–7 deterministic fallback questions per mode with structured hints. Honestly labeled as "Fallback Template Mode — AI not configured" when provider keys are absent.
- **STAR Answer Builder**: Four-field builder (Situation, Task, Action, Result) with a final polished answer draft. Users can generate templates, edit freely, copy, save to Answer Vault, or attach to Application Timeline.
- **Interview Readiness Score**: Heuristic self-assessment score (0–100) based on 7 preparation factors. Includes an explicit disclaimer that the score does not guarantee interview success.
- **Job/Company Context**: Contextual prep card showing company name, role, required skills, suggested topics, and salary notes when a job/application is selected. Safe empty state shown otherwise.
- **Guided Workflow Integration**: Added an Interview Preparation Status tracker card to the Guided Workflow page showing four stages: Not started, Questions prepared, Answers saved, Ready for mock interview.
- **Voice Note**: "Voice mock interview is provider-ready / future enhancement. Text mock interview is available now." No voice recording implemented.
- **Advanced Prep Route**: Created `/interviews/prep` as a protected workspace; linked from `/interviews` with an "Advanced Prep" button.
- **Backend API**: Added 6 new `/api/interviews/prep/*` endpoints (modes, question-bank, star-template, save-to-vault, readiness, context) — all authenticated, no secrets, fully tested.
- **Testing**: 7 new backend API tests; 1 comprehensive frontend page test; 1 new E2E protected route redirect test.
- **Documentation**: Created `docs/advanced-interview-prep.md` with full feature, API, safety, and limitations documentation.



- **Tone-Based Answer Synthesizer**: Expanded AI kit generator to support 7 distinct tones (Professional, Fresher-friendly, Technical, Confident, Polite follow-up, Short recruiter DM, Formal email) and 10 screening question types.
- **Safe AI Fallback System**: Implemented dynamic context-aware templates for mock/unconfigured AI modes that shape answers based on tone, job details, and matching skills. Honestly labeled outputs as "Fallback Template Mode" on the UI.
- **Recruiter CRM**: Added `/api/contacts` routes, services, and models to register recruiter contacts.
- **Recruiter Linking**: Added `contactId` to the application schema, allowing users to link recruiter contacts to their application tracker cards and return populated contact data.
- **Vault & Timeline Integration**: Provided UI controls to copy drafts, save answers directly to the local Answer Vault, and log activity events directly to the application tracker timeline history.
- **Disclaimers & Safety**: Added a prominent "Manual Review Required" safety warning. The assistant is strictly review-only, with no anti-detection or automated background sending.
- **Unit Testing**: Added frontend and backend test suites verifying tone outputs, CRM contacts, fallback tags, and linking operations. All tests passed.

### v2.0.26 — Job Aggregation and Deduplication Sprint (2026-05-26)

- **Heuristic & AI Job Parser**: Added backend extraction utility `parseJobText` supporting Lever/Greenhouse link parsing and technical keyword scanning fallbacks.
- **Deduplication Engine**: Integrated MongoDB duplicate checks mapping normalized title, company, location, and apply URLs.
- **Manual Import View**: Created `/jobs/import` frontend interface with automatic paste-parsing, full-form editing, and debounced duplicate alert checks.
- **Apply Readiness Score**: Structured a weighted formula mapping candidate match scores, resume ATS levels, and apply URL completeness.
- **E2E & Unit Tests**: Verified coverage for parsing, duplicate warning thresholds, scoring indices, and status flags (all 139+ tests passing).

### v2.0.25 — Advanced Orchestration, Schema and SEO Sprint (2026-05-26)

- **Resume Schema Enhancement**: Added sourceType, template, changeSummary, categoryScores, and scoreExplanation fields to Mongoose schemas. Refactored local scoring calculator to compute 5-category ATS scoring breakdown with detailed why-score explanations.
- **Portfolio SEO**: Integrated server-side generateMetadata helper using Next.js App Router to fetch minimal profile information and render OG tags, canonical URLs, and Twitter cards with fallback support.
- **Multi-Agent Orchestration / Next-Best-Action**: Added deterministic next-best-action recommendation engine, mounted `/api/workflow/next-best-actions` endpoint, and added recommended next actions and agent status cards to the guided-workflow UI.
- **SaaS Architecture Alignment**: Created `docs/pdf-blueprint-gap-map.md`, `docs/competitor-outperformance-strategy.md`, and `docs/browser-extension-safe-workflow.md` to align codebase features with security, compliance, and outperformance specifications.
- **Interactive Resume Builder (Phase 10)**: Created interactive WYSIWYG Resume Builder at `/resume/builder` with live-updating ATS diagnostics. Mounted backend `/api/resumes/score-draft` route to run local heuristic breakdown in-memory on active fields. Built dynamic forms for experience, projects, skills, and links with immediate score recalculation and missing keyword injection helpers.

### v2.0.24 — Product Readiness Audit Sprint (2026-05-26)

- **Comprehensive Product Audit**: Conducted a full website, codebase, security, and provider integration audit. Created `docs/complete-product-audit-report.md` mapping all 28+ routes, feature states, unauthenticated/authenticated behaviors, and UX gaps.
- **Provider Status Hardening**: Cataloged integration details for S3/R2 storage, SendGrid/SMTP, Google OAuth, OpenAI/Gemini, Stripe, Sentry, Better Stack, and external job boards in `docs/pending-gaps-and-provider-blockers.md`.
- **Advanced Real Product Roadmap**: Formulated `docs/advanced-real-product-roadmap.md` prioritizing P0 must-fix issues, P1 advanced features, P2 SaaS commercial expansions, and P3 polish.
- **Sprint Implementation Plan**: Created `docs/next-implementation-sprint-plan.md` defining the next 5 implementation sprints in exact execution order, including guidelines on what to avoid and PR gating.

### v2.0.23 — Provider Activation Readiness Sprint (2026-05-26)

- **Provider Status Audit**: Created `docs/provider-activation-status-audit.md` detailing required environment variables, configuration locations (Render or Vercel), verification methods, dependent features, security risks, and final activation status for all 14 integration providers.
- **Manual Setup Checklist**: Created `docs/manual-provider-setup-checklist.md` providing step-by-step console instructions, test commands, rollback guidelines, and common issues for S3/R2 storage, SendGrid/SMTP, Google OAuth, OpenAI/Gemini AI, Stripe, and external job boards.
- **Safe State Verification**: Executed automated and manual queries verifying `/ready` and `/status` endpoints return honest status categories (Live, Provider-ready, Local fallback, Not configured, Needs approval) matching the active environment without faking live claims.

### v2.0.22 — Playwright E2E Testing Workflow Sprint (2026-05-26)

- **Comprehensive Playwright E2E Tests**: Implemented a comprehensive E2E test suite in `frontend/e2e/smoke.spec.ts` covering 12 critical user flows including public routes, onboarding/auth views, unconfigured Google button states, forgot/reset password pages, protected route redirections, and mocked settings/integrations badge displays.
- **Hermetic Test Architecture**: Integrated Playwright native network interception using `page.route` to mock API endpoints. This isolates E2E tests from database state and backend server cold starts.
- **Testing Documentation**: Created `docs/playwright-e2e-testing.md` detailing browser installation rules, configuration parameters, execution commands, and security guidelines.
- **CI Verification**: Successfully integrated E2E tests in the workspace-level `ci:verify` script and confirmed that all code compilers, linters, unit tests, and E2E suites run and pass successfully.

### v2.0.21 — Google OAuth Activation Readiness (2026-05-25)

- **Dynamic Configuration Status Checks**: Upgraded `/api/auth/providers/status` and `/jobs/sources` to return the real three-state configuration status for Google OAuth: `live` (env keys present and configured), `ready` (env key placeholders exist in process.env but values are empty), and `not_configured` (env keys completely absent).
- **Safe Redirect Handoff**: Refactored the GET `/api/auth/google` and GET `/api/auth/google/callback` backend routes to redirect to `/login?error=Google OAuth credentials not configured` when Google OAuth variables are missing, replacing the previous raw JSON response.
- **Disabled Sign-In Buttons**: Hardened frontend sign-in/register pages to query backend status and display disabled buttons with "Continue with Google — coming soon" notices and helpful descriptions when unconfigured. Clicking the buttons is blocked, and no technical environment errors are shown to end users.
- **Security Risk & P0 Handoff Registration**: Documented the current token Transport callback behavior (short-lived 15-minute access token exposed in redirect URL query) and logged a P0 follow-up plan to migrate to HTTP-only cookie rehydration via `/api/auth/me`.
- **Automated Tests**: Wrote tests asserting correct rendering of login/register pages under configured vs unconfigured states, integrations status badges, and backend redirect locations. All tests successfully passed.

### v2.0.20 — Forgot/Reset Password Email Provider Readiness (2026-05-25)

- **Account Recovery Flow**: Hardened authentication system with secure token recovery. Generates a random 32-byte hex recovery token, hashes it using SHA-256 for Mongoose storage, enforces 1-hour expiration limits, and invalidates token fields upon update.
- **Account Enumeration Defense**: Protects user endpoints by returning a generic success recovery message. Features timeline delay simulations for invalid email queries to block timing scans.
- **SendGrid & SMTP Email Abstraction**: Upgraded the email service to deliver recovery links via direct fetch POST requests to SendGrid's V3 API or nodemailer transport if SMTP configurations exist.
- **Provider Status Badging**: Refactored the integrations API endpoints and frontend Integrations view to honestly display provider statuses as `"live"`, `"ready"` (placeholders configured but empty), or `"not_configured"`.
- **Form UX & Suspense Guarding**: Added a password requirement checklist to the Reset Password page. Wrapped recovery forms in Next.js Suspense boundaries to fix static build generation checks.
- **Verification**: Created comprehensive vitest unit tests in backend and frontend verifying all recover behaviors and UI elements. All tests pass successfully.

### v2.0.19 — Private Cloud Storage Hardening (2026-05-25)

- **Storage Abstraction Service**: Created `storage.service.ts` to abstract cloud object storing (S3/R2) with local fallback.
- **Signed URL Handling**: Updated resume upload and PDF export flows to utilize storage key lookup and dynamically resolve authenticated presigned download URLs on demand.
- **Provider Status**: Integrated S3/R2 storage provider credentials presence checks in `getProviderStatus` API responses.
- **Verification**: Added automated unit tests in `storage.test.ts` verifying file writing, signed URL formatting, and file deletions. All tests pass.

### v2.0.18 — Portfolio PDF Export & Storage Status Warnings (2026-05-25)

- **Portfolio PDF Export Action**: Added "Generate PDF" action on `/portfolio-generator` linked directly to the backend PDF generator service.
- **Dynamic Download Access**: Rendered dynamic "Download PDF" links with proper backend URL path mapping to download exports.
- **Durable Storage Warning Banner**: Implemented warning banners detailing local fallback/dev storage vs live secure S3/R2 storage environments.
- **Verification**: Wrote comprehensive unit tests covering warnings, preview rendering, and export PDF mutation flows. All 99 tests pass.

### v2.0.17 — Connected Jobs Feed & Context Match (2026-05-25)

- **Resume-to-Job Matching**: Implemented query parameter context `fromResume` resolution on the `/jobs` page to dynamically calculate overlap match scores, highlight strong fit skills, and detail missing skill gaps.
- **Dynamic Matching Banner**: Added interactive contextual banner displaying the active resume name and parsed skill count, with a quick-clear filter action.
- **Track App & Save Job Actions**: Integrated client mutations to "Track App" (creating a new application and navigating to Applications tracker) and "Save job" (bookmarking roles) directly from job card listings.
- **Verification**: Added comprehensive unit test assertions verifying search matching layout and tracking buttons. All 99 tests pass.

### v2.0.16 — Connected Guided Workflows (2026-05-25)

- **Dynamic Progress Calculation**: Refactored `/guided-workflow` frontend page to query real user data (resumes, applications, interviews, profile, answer vault).
- **Interactive Checklists**: Updated step indicators from static copy to dynamic progress labels showing counts (e.g. `Completed (3 resumes)`, `Completed (profile skills configured)`) and completion tick-icons.
- **Overall Progress Indicator**: Rendered an overall progress card displaying step status and a visual progress completion bar.
- **Verification**: Updated unit tests to mock fetch responses and verify progress rendering. All 99 tests passed.

### v2.0.15 — Career Vault Model and Routes (2026-05-25)

- **Career Vault Schema & Model**: Created the Mongoose schema for `CareerVault` to store structured work history, achievements, education, projects, certifications, and skills.
- **Validation, Service & Routes**: Implemented Zod validation schemas, service layer methods, and `/api/career-vault` routes (GET, POST, DELETE) for full RESTful resource management.
- **Verification**: Verified endpoint functionality in integration tests (`api.test.ts`) and checked page component rendering in unit tests (`pages.test.tsx`). All 99 tests passed.

### v2.0.14 — Connected Answer Vault & Predefined Templates (2026-05-25)

- **Answer Vault Schema & Model**: Created the Mongoose schema for `AnswerVault` with indexing on `userId` and `category`.
- **Validation, Service & Routes**: Implemented Zod validation schema, service handlers, and routes `/api/answer-vault` (GET, POST, DELETE) registered in the Express router with access control.
- **Frontend Tabbed Layout**: Built a tabbed dashboard on the `/answer-vault` page enabling users to toggle between custom vault answers and quick templates.
- **Predefined Behavioral & Negotiation Templates**: Added interactive templates with placeholder values (e.g. `[Target Role]`, `[Company Name]`, `[Years]`, `[Salary Min]`, `[Salary Max]`) that can be edited in real-time and copied or saved directly to the database vault.
- **Verification**: Verified endpoint functionality in integration tests (`api.test.ts`) and mock interactions in page unit tests (`pages.test.tsx`). All 97 tests passed.

### v2.0.13 — Company Research Fix (2026-05-25)

- **Company Research Schema & Model**: Created the Mongoose schema for `CompanyResearch` with indexing on `userId`.
- **Validation and Service Layer**: Implemented request body validation and service wrapper for creating, deleting, and retrieving company research documents.
- **REST Endpoints**: Registered `/api/company-research` in the Express router with access controls.
- **Verification**: Verified endpoint functionality in integration tests (`api.test.ts`) and rendered verification in page unit tests (`pages.test.tsx`). All 95 tests passed.

### v2.0.12 — Connected PDF Generation and Parameter Pre-fill (2026-05-25)

- **Search Parameter Pre-fill**: Updated the frontend PDF export page (`frontend/app/pdf-export/page.tsx`) to retrieve URL search parameters (like `versionId`, `resumeId`, `tailoredResumeId`, `applicationKitId`, `portfolioId`, and `interviewId`) and automatically populate corresponding input fields.
- **Next.js Suspense Optimization**: Wrapped the PDF export page content in a `<Suspense>` boundary to prevent Next.js static generation build time errors when calling `useSearchParams()`.
- **Pre-fill Loop Prevention**: Optimized the page mounting hook by running the URL pre-fill logic only on mount and checking state changes before updating state, preventing infinite re-render loops in test and development environments.
- **Verification**: Updated frontend unit tests to mock search parameters dynamically using `window.history.pushState` and verified correct form pre-population. All tests compiled and passed.

### v2.0.11 - Full Website Feature Audit and SaaS Upgrade Planning (2026-05-25)

- **Full Route and Feature Audit**: Added `docs/full-website-feature-audit.md` covering live status, route-by-route behavior, feature inventory, broken workflows, provider honesty, UX/mobile/accessibility, security/privacy, performance/reliability, testing, and SaaS realism.
- **Advanced Improvement Roadmap**: Added `docs/advanced-feature-improvement-roadmap.md` with P0/P1/P2/P3 recommendations, effort, risk, provider dependencies, and exact implementation format for each proposed improvement.
- **Realistic SaaS Upgrade Plan**: Added `docs/realistic-saas-upgrade-plan.md` distinguishing live, mock/fallback, provider-ready, not configured, and manual setup areas without exposing secrets.
- **Connected Workflow Next Actions**: Added `docs/connected-workflow-next-actions.md` defining the recommended first fixes, next sprint, what not to do, verification checklist, and next implementation prompt.
- **Existing Docs Updated**: Updated final summary, v2.1 roadmap, and beta feedback triage board to reflect the audit findings and stabilization-first order.

### v2.0.10 — Connected Resume Analysis Workflow (2026-05-25)

- **Gap Improvement Action Center**: Added interactive checkboxes and checklist panel mapping ATS recommendations directly to tailor actions.
- **Tailored Resume Draft Preview**: Rendered a preview displaying updated summary, skills, and improved project bullet points returned by the AI suggestion apply action.
- **Workflow Connectors**: Linked the tailored preview directly to PDF generation, job discovery with target role context (`/jobs?fromResume=ID`), and guided workflow pages.
- **Verification**: Updated frontend unit tests to query checklist options, verify disclaimers, suggestions, and action buttons. All tests passing.

### v2.0.9 — Resume Upload Hardening and Guide (2026-05-25)

- **Magic Number File Hardening**: Implemented strict hex header checking (`%PDF` for PDFs and `PK\x03\x04` for DOCXs) to prevent arbitrary code execution via extension spoofing.
- **Malware and Executable Rejection**: Automatically block common executable binary signatures (MZ/ELF) and unlink temporary upload files from local disk on validation failure.
- **PDF Parser Upgrade**: Integrated typescript ESM library `pdf-parse` (v2.x) to extract high-accuracy text on backend, with safety fallbacks on parsing failures.
- **Upload Guide UI**: Rendered a guide box on the upload page detailing format rules, 5MB limits, text-based PDF guidelines, recommended sections, and anonymization options.
- **Verification**: Added backend integration test cases for fake PDFs, executables, and size limits, and frontend test cases for guide UI.

### v2.0.8 — Password Guidance and Validation Alignment (2026-05-25)

- **Backend Password Validation Synchronized**: Configured frontend `validators.ts` to require password complexity constraints matching the backend (minimum 8, maximum 128 characters, at least one uppercase letter, one lowercase letter, and one number).
- **Frontend Password Guide and Notes**: Added interactive password criteria block on the registration form and a small usage note on the login form.
- **Error Display**: Enhanced the login and register forms to render clear, red field-level validation helper messages beneath input fields.
- **Verification & Tests**: Wrote frontend unit tests verifying guide visibility, weak password validation rejection, and login note visibility. Verified all test suites pass.

### v2.0.7 — Google OAuth Provider-Ready Integration (2026-05-25)

- **Google OAuth Status Check**: Implemented `/api/auth/providers/status` endpoint to query configured status of Google Client variables.
- **Backend Redirect Routes**: Created `/api/auth/google`, `/api/auth/google/callback` and `/api/auth/google/disconnect` route handlers. Callback exchanges Google code for user profile info, upserts standard candidate DB user, sets secure cookies, and redirects with token.
- **Frontend Dynamic Login Button**: Configured frontend `auth-form.tsx` to call status check on mount and automatically enable/disable the Google button depending on backend environment variables configuration (rendering "coming soon" when unset). Added OAuth token parsing and re-hydration on mount.
- **Settings Page Integration**: Integrated Google OAuth and other providers with `/jobs/sources` backend readiness checks, displaying status dynamically on integrations page.
- **Documentation**: Wrote `docs/google-oauth-activation.md` details setup, consent, URIs, env placement, and fallback policies.

### v2.0.6 — Connected Workflow Auth Persistence (2026-05-25)

- **Auth Persistence**: Extended `ajc_session` frontend cookie duration to 7 days, matching the backend refresh token cookie lifespan, and implemented automatic token refresh client-side interceptor on 401 response in `api.ts` to solve the repeated login redirect loop.
- **Gap Audit**: Created `docs/connected-workflow-gap-audit.md` documenting route, auth, and CRM workflow gaps.
- **Verification & Tests**: Added unit tests in `frontend/tests/pages.test.tsx` verifying the token refresh interceptor. Verified all 59 frontend tests and 25 backend tests passing, compiling cleanly.

### v2.0.5 — Open Beta Feedback & Hardening Plan (2026-05-24)

- **Feedback intake**: Logged first anonymized tester feedback (`OBF-01`) showing successful walkthroughs across signup, logins, ATS checking, and tracking flows.
- **Roadmap updates**: Updated priority matrix to transition upload security hardening (S3/R2 storage migration and magic number validation) as the next P0-1 task.
- **Sprint plan**: Created `docs/p0-upload-hardening-sprint-plan.md` defining the architecture, binary signature checks, limitations, and S3 client endpoints.
- **Triage and summary**: Updated feedback triage board and added `docs/open-beta-feedback-summary.md` detailing tester responses and next actions.

### v2.0.4 — Live Uptime Monitoring Active (2026-05-24)

- **Uptime Monitoring**: Manually configured Better Stack monitors for Backend Health (`https://ai-job-copilot-backend-l6ut.onrender.com/health`) and Frontend (`https://ai-job-copilot-frontend.vercel.app`), both verifying HTTP status 200. Added cold-start timeout alerts context.
- **Documentation**: Updated monitoring plan, launch execution, master status matrix, and summary report to verify that uptime monitoring is active and the open beta launch can proceed.

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
