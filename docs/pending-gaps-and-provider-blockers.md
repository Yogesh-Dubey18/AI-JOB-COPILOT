# AI Job Copilot — Pending Gaps & Provider Blockers

This document maps all technical gaps, unconfigured integrations, required API approvals, and step-by-step setup guides to activate the platform's external dependencies.

---

## 🚦 Provider Status Breakdown

| Integration | Audited Classification | Required API Keys / Credentials | Dependent Feature | Blockers / Risks |
|---|---|---|---|---|
| **MongoDB Atlas** | **Live** | `MONGODB_URI` | All persistence (Auth, Resumes, Jobs, CRM) | None. Fully active. |
| **AWS S3 / R2** | **Provider-ready** | `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | Private resume upload & PDF download links | Ephemeral Render storage. File loss risk. |
| **SendGrid / SMTP** | **Provider-ready** | `SENDGRID_API_KEY` or `SMTP_PASS` | Password recovery, alerts, follow-up emails | No recovery emails can be sent to users. |
| **Google OAuth** | **Provider-ready** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | One-click login & registration | URL token exposure risk (Callback redirection). |
| **OpenAI / Gemini** | **Provider-ready** | `OPENAI_API_KEY` or `GEMINI_API_KEY` | ATS scan, tailored drafts, interview prep, chat | Mocks active. Generates static text blocks. |
| **Stripe Billing** | **Provider-ready** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paid plan upgrades & usage restrictions | Sandbox bypass mode active. Free premium access. |
| **LinkedIn Jobs** | **Needs approval** | Approved developer partner credentials | Curated, real-time technology job feed | API request scraping rules & TOS limits. |
| **Indeed Publisher** | **Needs approval** | Approved publisher feed client key | Standard job board search listings | Rejected feed applications. |
| **Naukri API** | **Needs approval** | India partner access credentials | India developer job feed listings | Restricted scraping. |
| **ZipRecruiter** | **Needs approval** | Publisher API token | US job board listings feed | API rate limit bounds. |
| **Dice API** | **Needs approval** | Tech feed partner credentials | Developer-focused job search listings | Feed licensing cost. |
| **GitHub API** | **Provider-ready** | `GITHUB_TOKEN` | Repository complexity checklist stats | No live stats fetched. Checklists are static. |
| **Sentry** | **Provider-ready** | `SENTRY_DSN` | External error tracking & reliability logs | Backend crashes only logged to Render CLI. |
| **Better Stack** | **Provider-ready** | Uptime check console dashboard hook | Server warm-up pings & health alerts | Manual checking of dashboard. |

---

## 🛠️ Step-by-Step Manual Setup Guides

### 1. Private Object Storage Setup (AWS S3 / Cloudflare R2)
1. Sign up for an **AWS Console** or **Cloudflare Dashboard** account.
2. Navigate to **S3** (or **R2**) and click **Create Bucket**.
   - Set Name: `ai-job-copilot-resumes`
   - Region: Choose preferred region (e.g. `us-east-1` for S3).
   - **Crucial**: Check the box to **Block all public access**.
3. Go to IAM and create a new **Service User** with programmatic access:
   - Assign policy: `AmazonS3FullAccess` (restrict to your specific bucket for production).
   - Save the `Access Key ID` and `Secret Access Key`.
4. Add environment variables to the backend service configuration:
   ```bash
   STORAGE_PROVIDER=s3  # or r2
   STORAGE_BUCKET_NAME=ai-job-copilot-resumes
   STORAGE_REGION=us-east-1
   STORAGE_ACCESS_KEY_ID=your_access_key_id
   STORAGE_SECRET_ACCESS_KEY=your_secret_access_key
   ```
5. Restart the backend. Confirm uploaded files generate presigned URLs ending in expiry tokens.

---

### 2. Transactional Email Setup (SendGrid / SMTP)
1. Create a developer account on **SendGrid.com**.
2. Complete **Sender Identity Verification** (verify your domain's SPF/DKIM records or verify a single sender address).
3. Navigate to **API Keys** under Settings and click **Create API Key** (assign Mail Send permissions only).
4. Save the key token safely.
5. Add configuration variables to Render:
   ```bash
   EMAIL_PROVIDER=sendgrid
   EMAIL_FROM=support@yourdomain.com
   SENDGRID_API_KEY=SG.your_api_key_here
   ```
6. Retest by triggering the "Forgot Password" flow and verifying receipt.

---

### 3. Google OAuth Setup
1. Open the **Google Cloud Console** (`console.cloud.google.com`).
2. Create a new project named `AI Job Copilot`.
3. Configure the **OAuth Consent Screen**:
   - User Type: External.
   - Scopes: `email`, `profile`.
4. Go to **Credentials**, click **Create Credentials** -> **OAuth Client ID**:
   - Application Type: Web Application.
   - Authorized JavaScript Origins: `https://ai-job-copilot-frontend.vercel.app`
   - Authorized Redirect URIs: `https://ai-job-copilot-backend-l6ut.onrender.com/api/auth/google/callback`
5. Copy the generated `Client ID` and `Client Secret`.
6. Add environment variables:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret
   GOOGLE_REDIRECT_URI=https://ai-job-copilot-backend-l6ut.onrender.com/api/auth/google/callback
   ```
7. Verify that the Google sign-in button is active.

---

### 4. OpenAI / Gemini AI Integration
1. Register an account at **platform.openai.com** (or **aistudio.google.com**).
2. Attach a credit card to set billing thresholds.
3. Generate a new API Key (e.g. `sk-...`).
4. Set variables:
   ```bash
   AI_PROVIDER=openai  # or gemini
   OPENAI_API_KEY=sk-your_openai_key
   # or GEMINI_API_KEY=your_gemini_key
   ```
5. Run resume ATS scans to confirm real-time suggestions generate correctly.

---

### 5. Stripe Billing Integration
1. Access the **Stripe Dashboard** (`dashboard.stripe.com`) and toggle **Test Mode**.
2. Go to **Product Catalog** and create two plans:
   - **Pro Plan**: Recurring monthly subscription (e.g. $15).
   - **Premium Plan**: Recurring monthly subscription (e.g. $29).
3. Copy the `Price ID` for both plans.
4. Navigate to **Developers** -> **Webhooks**:
   - Add endpoint: `https://ai-job-copilot-backend-l6ut.onrender.com/api/billing/webhook`
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
5. Copy the **Signing Secret** (`whsec_...`).
6. Set variables in Render:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   STRIPE_PRICE_PRO=price_12345_pro
   STRIPE_PRICE_PREMIUM=price_12345_premium
   ```
7. Verify upgrades update user statuses in the DB.
