# Provider Activation Master Report

This report catalogs all 12+ integrations, their current classification status, their fallback architectures, and the exact list of environment variable keys required to activate them.

---

## 📋 Integration Status Matrix

| Integration | Category | Status | Required Env Var Keys | Fallback Mechanism |
|---|---|---|---|---|
| **MongoDB Atlas** | Database | **Live** | `MONGODB_URI` | None (Primary database) |
| **OpenAI / Gemini** | AI Engine | **Provider-ready** | `OPENAI_API_KEY`, `GEMINI_API_KEY` | local heuristic parsing and mock LLM responses |
| **AWS S3 / R2** | File Storage | **Provider-ready** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | local `uploads/` directory on disk |
| **SendGrid / SMTP** | Email | **Provider-ready** | `SENDGRID_API_KEY`, `SMTP_HOST`, `SMTP_PORT` | mock console logging of emails |
| **Google OAuth** | Identity Auth | **Provider-ready** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | standard email/password login flow |
| **Google Calendar** | Calendar scheduling | **Provider-ready** | `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET` | local database interview schedule logs |
| **Stripe** | Subscriptions | **Provider-ready** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | mock bypass activation button |
| **LinkedIn Jobs API** | Job Boards | **Provider-ready** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | seed data / scraped job database feed |
| **Indeed Publisher** | Job Boards | **Provider-ready** | `INDEED_PUBLISHER_ID` | seed data / scraped job database feed |
| **Naukri API** | Job Boards | **Provider-ready** | `NAUKRI_API_KEY` | seed data / scraped job database feed |
| **GitHub API** | Project Analyzer | **Provider-ready** | `GITHUB_TOKEN` | static project checklists & tips |
| **Sentry** | Observability | **Provider-ready** | `SENTRY_DSN` | standard console log errors and boundary alerts |
| **Uptime Monitoring**| Monitoring | **Provider-ready** | None (External monitor) | manual warm-up checking of `/health` |
| **Course APIs** | Learn Roadmaps | **Provider-ready** | None (Static lists) | hardcoded educational reference links |

---

## 🛠️ Fallback Architecture Details

### 1. AI Fallbacks
If no AI keys are present, the backend falls back to local regex rule-based ATS parsing, keyword analysis, checklist-based score calculation, and static text generation templates for interview questions and salary metrics. The frontend displays disclaimers highlighting "provider-ready" status.

### 2. Storage Fallback
If AWS credentials are unset, files are saved locally to the backend `uploads/` folder. Access urls are mapped to the backend endpoint `/uploads/*`.

### 3. Payment Fallback
If Stripe keys are unset, a button saying "Activate Demo" appears in `/settings/billing`, which triggers a mock upgrade to give the user immediate premium capabilities.

### 4. Job Search Fallbacks
If external job board APIs are disabled, the jobs board queries the normalized database collection seeded with typical tech stack developer listings (React, Node.js, MERN Stack, Java developer, etc.), ensuring users always have matching roles to test.
