# Provider Activation Status Audit

This document lists all external integration providers within the **AI Job Copilot** platform. It details their current status, required environment variable keys, configuration locations, verification steps, security notes, and manual setup tasks.

---

## 📋 Integration Status Matrix

| Provider | Category | Status | Required Env Var Keys | Fallback Mechanism |
|---|---|---|---|---|
| **MongoDB Atlas** | Database | **Live** | `MONGODB_URI` | None (Primary database) |
| **AWS S3 / Cloudflare R2** | File Storage | **Provider-ready** | `STORAGE_PROVIDER`, `STORAGE_BUCKET_NAME`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | local `uploads/` directory on disk |
| **SendGrid / SMTP** | Email | **Provider-ready** | `EMAIL_PROVIDER`, `EMAIL_FROM`, `SENDGRID_API_KEY` (or `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) | mock console logging of emails |
| **Google OAuth** | Identity Auth | **Provider-ready** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `CLIENT_URL` | standard email/password login flow |
| **OpenAI / Gemini AI** | AI Engine | **Provider-ready** | `OPENAI_API_KEY` or `GEMINI_API_KEY` | local heuristic parsing and mock LLM templates |
| **Stripe** | Subscriptions | **Provider-ready** | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | mock bypass upgrade button |
| **LinkedIn Jobs** | Job Boards | **Needs approval** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | seed data / database feed fallback |
| **Indeed** | Job Boards | **Needs approval** | `INDEED_API_KEY` | seed data / database feed fallback |
| **Naukri** | Job Boards | **Needs approval** | `NAUKRI_API_KEY` | seed data / database feed fallback |
| **ZipRecruiter** | Job Boards | **Needs approval** | `ZIPRECRUITER_API_KEY` | seed data / database feed fallback |
| **Dice** | Job Boards | **Needs approval** | `DICE_API_KEY` | seed data / database feed fallback |
| **GitHub API** | Project Analyzer | **Provider-ready** | `GITHUB_TOKEN` | static project checklists & tips |
| **Sentry** | Observability | **Provider-ready** | `SENTRY_DSN` | standard console log errors |
| **Better Stack** | Uptime Monitor | **Provider-ready** | None (External monitor) | manual warm-up checking of `/health` |

---

## 🔍 Detailed Provider Audit

### 1. MongoDB Atlas
* **Current Status**: **Live** (the backend successfully connects to the cluster).
* **Required Env Vars**: `MONGODB_URI`
* **Configuration Dashboard**: Render (Backend Web Service environment)
* **How to Verify**: Check the backend `/health` endpoint. If successful, the database is active and returns `200 OK`.
* **User-Facing Feature**: All core capabilities (auth, resumes, applications, interviews, contacts, career vault, etc.) depend on DB persistence.
* **Security Risk**: Access token or credential leaks. Must restrict access using network firewall rules or IP allowlists.
* **Manual Setup Needed**: Create Atlas M0 cluster, add database user, configure IP Access List (allow Render outbound IPs or `0.0.0.0/0` for serverless environments).

### 2. AWS S3 / Cloudflare R2 Storage
* **Current Status**: **Provider-ready**
* **Required Env Vars**:
  - `STORAGE_PROVIDER=s3` or `r2`
  - `STORAGE_BUCKET_NAME`
  - `STORAGE_REGION`
  - `STORAGE_ACCESS_KEY_ID`
  - `STORAGE_SECRET_ACCESS_KEY`
  - `STORAGE_ENDPOINT` (Required for Cloudflare R2 only)
  - `STORAGE_SIGNED_URL_TTL_SECONDS=900`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Upload a resume PDF. Check the backend network response. The returned link should be a secure signed presigned URL instead of a local `/uploads/...` URL.
* **User-Facing Feature**: PDF resume storage and PDF exports (resumes, portfolios, cover letters, prep guides).
* **Security Risk**: Bucket access policy misconfiguration. Bucket must block public access; all file reading is served via short-lived authenticated pre-signed URLs.
* **Manual Setup Needed**: Create private bucket in AWS console or Cloudflare R2 dashboard, create IAM/API access keys restricted to bucket operations.

### 3. SendGrid / SMTP Email
* **Current Status**: **Provider-ready** (falls back to logging token links to console logs).
* **Required Env Vars**:
  - `EMAIL_PROVIDER=sendgrid` or `smtp`
  - `EMAIL_FROM`
  - `SENDGRID_API_KEY` (for SendGrid)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (for SMTP)
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Trigger a forgot password link on the frontend. Confirm that the recovery email is delivered to the recipient's inbox.
* **User-Facing Feature**: Forgot password recovery emails and future interview reminder alerts.
* **Security Risk**: Key exposure. Tokens are stored hashed (SHA-256) in the database and automatically expire in 1 hour. Timing scans are mitigated via delay simulations on nonexistent users.
* **Manual Setup Needed**: Verify sender domain or single sender email on SendGrid. Obtain SMTP credentials from email provider.

### 4. Google OAuth
* **Current Status**: **Provider-ready** (the sign-in button is disabled on the frontend and shows a helper notice).
* **Required Env Vars**:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
  - `CLIENT_URL`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Verify that the Google sign-in button is enabled and successfully redirects to the Google account selection screen and back to `/dashboard` upon click.
* **User-Facing Feature**: One-click Google signup and login.
* **Security Risk**: Client secret leak. Redirect token handoff currently passes the short-lived access token via URL query string. Transitioning to secure HttpOnly cookies is planned.
* **Manual Setup Needed**: Configure OAuth consent screen in Google Cloud Console, create OAuth client ID credentials, and set authorized callback URI.

### 5. OpenAI / Gemini AI
* **Current Status**: **Provider-ready** (falls back to mock AI text templates).
* **Required Env Vars**:
  - `OPENAI_API_KEY` (for OpenAI)
  - `GEMINI_API_KEY` (for Gemini)
  - `AI_PROVIDER=openai` or `gemini`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Run ATS resume analysis. Verify that generated feedback, keywords, and action suggestions match the resume content instead of seeded template text.
* **User-Facing Feature**: Resume parsing, ATS scoring suggestions, cover letter generation, interview prep checklist, mock interview feedback, career mentor chat, skill gaps.
* **Security Risk**: Key exposure leading to billing abuse. Raw prompts are never logged, and resume PII details can be anonymized before sending to AI providers.
* **Manual Setup Needed**: Register on OpenAI platform or Google AI Studio, set billing limits, generate API keys.

### 6. Stripe
* **Current Status**: **Provider-ready** (falls back to mock bypass upgrade button in billing).
* **Required Env Vars**:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Frontend)
* **Configuration Dashboard**: Render (Backend) and Vercel (Frontend)
* **How to Verify**: Access billing settings, click upgrade, complete checkout on Stripe Sandbox, verify webhook updates user status to Premium.
* **User-Facing Feature**: Subscriptions and billing plan restrictions.
* **Security Risk**: Key leaks. Webhook endpoint signing keys must match to prevent request forgery.
* **Manual Setup Needed**: Setup Stripe merchant account, configure developer webhooks pointing to `/api/billing/webhook`.

### 7. LinkedIn Jobs
* **Current Status**: **Needs approval**
* **Required Env Vars**: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Browse job feed. Verify live LinkedIn jobs populate.
* **User-Facing Feature**: Automated jobs feed and LinkedIn profile data import.
* **Security Risk**: API key leak. Auto-apply is disabled to remain terms-compliant.
* **Manual Setup Needed**: Submit developer portal application for LinkedIn Jobs Partner API.

### 8. Indeed
* **Current Status**: **Needs approval**
* **Required Env Vars**: `INDEED_API_KEY`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Browse job feed. Verify Indeed listings populate.
* **User-Facing Feature**: Curator jobs feed search.
* **Security Risk**: Key exposure.
* **Manual Setup Needed**: Apply for Indeed Publisher API partnership.

### 9. Naukri
* **Current Status**: **Needs approval**
* **Required Env Vars**: `NAUKRI_API_KEY`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Browse job feed. Verify India listings populate.
* **User-Facing Feature**: Regional developer jobs indexing.
* **Security Risk**: Key exposure.
* **Manual Setup Needed**: Request developer partnership credentials from Naukri.com recruiter support.

### 10. ZipRecruiter
* **Current Status**: **Needs approval**
* **Required Env Vars**: `ZIPRECRUITER_API_KEY`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Browse job feed. Verify ZipRecruiter jobs populate.
* **User-Facing Feature**: Job listings search.
* **Security Risk**: Key exposure.
* **Manual Setup Needed**: Apply for ZipRecruiter Publisher API keys.

### 11. Dice
* **Current Status**: **Needs approval**
* **Required Env Vars**: `DICE_API_KEY`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Browse job feed. Verify technology job listings populate.
* **User-Facing Feature**: Tech developer job feed indexing.
* **Security Risk**: Key exposure.
* **Manual Setup Needed**: Register for Dice Developer Portal access.

### 12. GitHub API
* **Current Status**: **Provider-ready** (falls back to static mock checklists).
* **Required Env Vars**: `GITHUB_TOKEN`
* **Configuration Dashboard**: Render (Backend)
* **How to Verify**: Submit a public repository link through `/api/portfolios/github/check` or the Portfolio Generator. Verify safe metadata such as README presence, languages, topics, default branch, and last updated date. Do not mark stars, forks, commits, or verification claims as fetched unless a future feature explicitly adds verified fields.
* **User-Facing Feature**: GitHub Project Complexity Analyzer.
* **Security Risk**: Token scope exposure. Personal access token must only possess `public_repo` read scope.
* **Manual Setup Needed**: Create classic access token in GitHub developer settings.

### 13. Sentry
* **Current Status**: **Provider-ready** (defaults to console logger).
* **Required Env Vars**:
  - `MONITORING_PROVIDER=sentry`
  - `SENTRY_DSN`
  - `NEXT_PUBLIC_MONITORING_PROVIDER=sentry` (Frontend)
  - `NEXT_PUBLIC_SENTRY_DSN` (Frontend)
* **Configuration Dashboard**: Render (Backend) & Vercel (Frontend)
* **How to Verify**: Throw a frontend/backend error. Verify it appears on Sentry dashboard.
* **User-Facing Feature**: Observability, error logging, and system reliability alerts.
* **Security Risk**: Exposing project tokens or sensitive data in reports. Resumes and AI outputs are redacted before logging.
* **Manual Setup Needed**: Create Sentry project, obtain DSN keys.

### 14. Better Stack
* **Current Status**: **Provider-ready**
* **Required Env Vars**: None on app side.
* **Configuration Dashboard**: Better Stack console (External)
* **How to Verify**: Inspect Better Stack uptime metrics. Uptime check should log 200 OK on `/health` endpoint.
* **User-Facing Feature**: Status pages and system alerts.
* **Security Risk**: Uptime ping overload (mitigated by caching and using lightweight `/health` check).
* **Manual Setup Needed**: Create Better Stack monitor pointing to the backend health endpoint.
