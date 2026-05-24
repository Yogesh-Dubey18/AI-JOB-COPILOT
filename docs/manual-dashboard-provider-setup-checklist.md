# Manual Dashboard Provider Setup Checklist

This document is a setup checklist for system administrators deploying the **AI Job Copilot** platform. Follow these steps to configure backend environment variables in **Render** and frontend environment variables in **Vercel** dashboards.

---

## 🚀 Render (Backend Services) Configuration

Add these variables in the **Environment** section of your Web Service in the Render Dashboard:

### 1. Database (MongoDB)
- [ ] `MONGODB_URI` — Connection URI from MongoDB Atlas (e.g., `mongodb+srv://<username>:<password>@cluster.mongodb.net/...`).

### 2. JWT Authentication Secrets
- [ ] `JWT_ACCESS_SECRET` — A secure, random string (e.g., `openssl rand -hex 32` output) for signing short-lived access tokens.
- [ ] `JWT_REFRESH_SECRET` — A secure, random string for signing long-lived refresh tokens.

### 3. AI Providers
- [ ] `OPENAI_API_KEY` — (Optional) Secret key from platform.openai.com.
- [ ] `GEMINI_API_KEY` — (Optional) Secret API key from aistudio.google.com.
  > [!NOTE]
  > If both are set, OpenAI takes precedence. If neither is set, mock AI templates will handle the requests.

### 4. Stripe Subscriptions
- [ ] `STRIPE_SECRET_KEY` — Secret key (`sk_live_...` or `sk_test_...`) from Stripe Dashboard.
- [ ] `STRIPE_WEBHOOK_SECRET` — Webhook endpoint signing secret (`whsec_...`) obtained after adding the webhook endpoint.

### 5. Email (SendGrid / SMTP)
- [ ] `SENDGRID_API_KEY` — API Key from SendGrid (`SG....`).
- [ ] `EMAIL_FROM` — Verified sender email address (e.g., `noreply@yourdomain.com`).

### 6. File Storage (AWS S3)
- [ ] `AWS_ACCESS_KEY_ID` — IAM user access key.
- [ ] `AWS_SECRET_ACCESS_KEY` — IAM user secret key.
- [ ] `AWS_S3_BUCKET` — S3 bucket name.
- [ ] `AWS_REGION` — AWS Region code (e.g., `us-east-1`).

### 7. Google Integration
- [ ] `GOOGLE_CLIENT_ID` — OAuth Client ID from Google Cloud Console.
- [ ] `GOOGLE_CLIENT_SECRET` — OAuth Client Secret.
- [ ] `GOOGLE_CALENDAR_CLIENT_ID` — Google Calendar Client ID.
- [ ] `GOOGLE_CALENDAR_CLIENT_SECRET` — Google Calendar Client Secret.

### 8. GitHub API
- [ ] `GITHUB_TOKEN` — Classic Personal Access Token (`ghp_...`) with `public_repo` scope.

---

## ⚡ Vercel (Frontend Services) Configuration

Add these variables in the **Environment Variables** section of your Project Settings in Vercel:

### 1. API Endpoint
- [ ] `NEXT_PUBLIC_API_URL` — Set to `https://ai-job-copilot-backend-l6ut.onrender.com/api` (the live production backend URL).

### 2. Stripe Payments
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Publishable Key (`pk_live_...` or `pk_test_...`) matching the backend secret key.

### 3. Monitoring
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — DSN from Sentry project for client-side error reporting.

---

## ⚠️ Rollback Checklist

Before changing any live dashboard variables, confirm:
1. [ ] A backup of the current active variables list is saved locally.
2. [ ] Deployment settings have "Auto-deploy on change" disabled to prevent immediate build triggers.
3. [ ] If a build fails or routes become unreachable after updating variables, revert keys immediately to the backup copy and trigger a manual redeploy.
