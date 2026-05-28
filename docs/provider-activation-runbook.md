# Real Provider Activation Runbook

**AI Job Copilot — Production Activation Guide**  
**Updated:** May 2026  
**Status:** All providers listed below are provider-ready. Follow the steps in each section to go live.

---

> [!IMPORTANT]
> **Before activating any provider:** Run `npm run check:git-safety` and `npm run check:security` to confirm no credentials are committed to the repository. Never commit API keys, secrets, or tokens.

---

## Backend Environment Template

Copy `backend/.env.example` to `backend/.env` and fill in the values below.

```
# ============================================================
# AI JOB COPILOT — PRODUCTION ENVIRONMENT TEMPLATE
# ============================================================
# Copy this to backend/.env and fill in real values.
# Never commit backend/.env to version control.

# --- Database ---
MONGODB_URI=

# --- Authentication ---
JWT_SECRET=
JWT_REFRESH_SECRET=

# --- AI Provider (choose one or both) ---
OPENAI_API_KEY=
GEMINI_API_KEY=

# --- Google OAuth ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# --- Job Boards ---
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
INDEED_PUBLISHER_ID=
NAUKRI_API_KEY=

# --- Email ---
SENDGRID_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# --- Payments ---
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# --- Storage ---
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# --- Calendar ---
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=

# --- GitHub ---
GITHUB_TOKEN=

# --- Monitoring ---
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=v2.0.0

# --- App Config ---
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://ai-job-copilot-frontend.vercel.app
```

---

## Provider 1 — MongoDB Atlas (Database)

**Status:** Live (demo connection string used)  
**Required for:** All data storage, users, resumes, jobs, applications, interviews.

### Activation Steps
1. Log in at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster (or paid tier for production)
3. Go to Database → Connect → Drivers → Copy connection string
4. Replace `<password>` with the database user password
5. Set `MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai-job-copilot?retryWrites=true&w=majority` in backend `.env`
6. Go to Security → Network Access → Add IP: `0.0.0.0/0` (or Render/Vercel IP ranges)
7. Restart backend. `GET /health` should return `{ db: "connected" }`

---

## Provider 2 — OpenAI / Gemini (AI)

**Status:** Provider-ready  
**Required for:** Resume analysis, ATS scoring, cover letter, mock interviews, skill roadmap, GitHub analyzer, mentor chat, company research.

### OpenAI Activation
1. Log in at [platform.openai.com](https://platform.openai.com)
2. API Keys → Create new secret key
3. Set `OPENAI_API_KEY=` in backend `.env` using a real secret from the provider dashboard.
4. Verify billing is set up (usage limits recommended)
5. Test: POST `/api/ai/test` with a simple message

### Gemini Activation (alternative)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Get API key
3. Set `GEMINI_API_KEY=` in backend `.env` using a real secret from Google AI Studio.
4. The backend will use Gemini if `OPENAI_API_KEY` is not set

---

## Provider 3 — Google OAuth

**Status:** Provider-ready  
**Required for:** One-click Google sign-in.

### Activation Steps
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable Google+ API and OAuth 2.0
3. Credentials → Create OAuth 2.0 Client ID (Web application)
4. Authorized redirect URIs: `https://ai-job-copilot-backend-l6ut.onrender.com/api/auth/google/callback`
5. Copy Client ID and Client Secret
6. Set in backend `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
7. Test the OAuth flow by clicking "Continue with Google" on the login page

---

## Provider 4 — Stripe (Payments)

**Status:** Provider-ready  
**Required for:** Subscription billing, plan enforcement, invoices.

### Activation Steps
1. Log in at [stripe.com](https://stripe.com)
2. Developers → API Keys → Copy Publishable Key and Secret Key
3. Set in backend `.env`:
   ```
   STRIPE_SECRET_KEY=
   STRIPE_PUBLISHABLE_KEY=
   ```
4. Webhooks → Add endpoint: `https://ai-job-copilot-backend-l6ut.onrender.com/api/billing/webhook`
5. Select events: `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`, `invoice.payment_failed`
6. Copy Webhook Secret and set `STRIPE_WEBHOOK_SECRET=` in Render.
7. Set frontend `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=` in Vercel environment variables.
8. Test with Stripe test cards before going live

---

## Provider 5 — LinkedIn Jobs API

**Status:** Provider-ready (requires LinkedIn partner approval)  
**Required for:** Live LinkedIn job listings in the jobs feed.

### Activation Steps
1. Apply at [developer.linkedin.com](https://developer.linkedin.com) for Jobs API access (partner program)
2. LinkedIn reviews applications — process can take 2–4 weeks
3. Once approved, create an app and get Client ID + Client Secret
4. Set in backend `.env`:
   ```
   LINKEDIN_CLIENT_ID=...
   LINKEDIN_CLIENT_SECRET=...
   LINKEDIN_ENABLED=true
   ```
5. Test by checking the job feed — LinkedIn jobs should appear

> **Note:** LinkedIn does not have a simple self-serve Jobs API. The "Jobs Ingestion API" requires a LinkedIn partner contract. Without approval, the job feed shows internal/web-scraped jobs only.

---

## Provider 6 — Indeed Publisher API

**Status:** Provider-ready (requires approved publisher account)  
**Required for:** Live Indeed job listings in the jobs feed.

### Activation Steps
1. Sign up at [indeed.com/publisher](https://www.indeed.com/publisher)
2. Complete the publisher program application
3. Once approved, get Publisher ID
4. Set `INDEED_PUBLISHER_ID=...` in backend `.env`
5. Test by checking the job feed — Indeed jobs should appear

---

## Provider 7 — SendGrid (Email Notifications)

**Status:** Provider-ready  
**Required for:** Interview reminders, follow-up reminders, application alerts, OTP.

### Activation Steps
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Go to Settings → API Keys → Create API Key (Full Access)
3. Verify your sender domain (Settings → Sender Authentication)
4. Set in backend `.env`:
   ```
   SENDGRID_API_KEY=SG....
   EMAIL_FROM=noreply@yourdomain.com
   ```
5. Test by triggering a follow-up reminder and checking inbox
6. Check SendGrid Activity Feed to confirm delivery

---

## Provider 8 — AWS S3 (File Storage)

**Status:** Provider-ready  
**Required for:** PDF resume storage, exported documents.

### Activation Steps
1. Log in at [aws.amazon.com](https://aws.amazon.com)
2. S3 → Create Bucket (e.g., `ai-job-copilot-resumes`)
3. IAM → Create User with S3 access → Download Access Key ID and Secret
4. Set in backend `.env`:
   ```
   AWS_ACCESS_KEY_ID=AKI...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET=ai-job-copilot-resumes
   AWS_REGION=ap-south-1
   ```
5. Test by uploading a resume — confirm the file appears in S3

---

## Provider 9 — GitHub API

**Status:** Provider-ready  
**Required for:** Safe GitHub metadata such as README presence, languages, topics, default branch, and last updated date for portfolio proof and GitHub analyzer workflows. Do not fetch or invent stars, contributors, forks, commits, or verification claims.

### Activation Steps
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate new token (classic) → Select: `public_repo`, `read:user`
3. Set the `GITHUB_TOKEN` backend environment variable using the real token from GitHub.
4. Test: POST `/api/portfolios/github/check` with a public repo URL and confirm metadata is returned before marking GitHub Live.

---

## Provider 10 — Naukri API

**Status:** Provider-ready (requires partner credentials)  
**Required for:** Live Naukri.com job listings.

### Activation Steps
1. Contact Naukri at [naukri.com/recruiter](https://recruiter.naukri.com) or via their API partner program
2. Obtain API partner credentials
3. Set `NAUKRI_API_KEY=...` in backend `.env`
4. Test the job feed

---

## Frontend Environment (Vercel)

Set these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Required |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | `https://ai-job-copilot-backend-l6ut.onrender.com/api` | ✅ Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | empty until configured | Stripe only |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN | Monitoring |

---

## Pre-Launch Checklist

### Security
- [ ] No secrets committed to git (`npm run check:security`)
- [ ] No .env files in repo (only .env.example)
- [ ] All API endpoints require authentication (review middleware)
- [ ] Rate limiting is enabled on auth endpoints
- [ ] CORS is configured for frontend domain only

### Backend
- [ ] `GET /health` returns `{ status: "ok", db: "connected" }`
- [ ] JWT secret is a strong random string (not "secret" or "changeme")
- [ ] MongoDB IP allowlist restricts to Render IP (or 0.0.0.0/0 for serverless)
- [ ] All environment variables set in Render dashboard

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` is set to production backend URL
- [ ] No localhost URLs in production build
- [ ] All environment variables set in Vercel dashboard

### Monitoring
- [ ] Sentry DSN configured (optional but recommended)
- [ ] Uptime monitor set up for `/health` endpoint
- [ ] Smoke test checklist completed

### Legal
- [ ] Privacy policy is up to date and reflects all active providers
- [ ] Terms of service are published
- [ ] Cookie consent/banner implemented if required
- [ ] GDPR / DPDPA compliance reviewed

---

## Emergency Rollback Plan

1. Revert Vercel deployment to previous successful deployment
2. Revert Render backend to previous deployment
3. Check `/health` endpoint
4. Announce maintenance on status page
5. Investigate root cause before re-deploying

---

## Support Contacts

| Provider | Support |
|----------|---------|
| MongoDB Atlas | support.mongodb.com |
| OpenAI | help.openai.com |
| Google Cloud | cloud.google.com/support |
| Stripe | support.stripe.com |
| SendGrid | support.sendgrid.com |
| Vercel | vercel.com/support |
| Render | render.com/docs |
| GitHub | github.com/contact |
