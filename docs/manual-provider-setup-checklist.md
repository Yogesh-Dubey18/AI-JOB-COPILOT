# Manual Provider Setup Checklist

This document is a manual setup guide for administrators to activate external integrations within the **AI Job Copilot** platform. Follow these checklists to provision accounts, retrieve credentials, configure environment variables in Web dashboards, and verify connections.

---

## 📦 1. Cloud Storage Setup (S3/R2)

### Account Console Link Name
* AWS Management Console or Cloudflare Dashboard

### Required Env Vars
* `STORAGE_PROVIDER` (set to `s3` or `r2`)
* `STORAGE_BUCKET_NAME`
* `STORAGE_REGION`
* `STORAGE_ACCESS_KEY_ID`
* `STORAGE_SECRET_ACCESS_KEY`
* `STORAGE_ENDPOINT` (Required for Cloudflare R2 only)
* `STORAGE_SIGNED_URL_TTL_SECONDS` (Optional, defaults to 900)

### Render Placement
* Add all variables in the **Environment** tab of the backend Web Service dashboard.

### Vercel Placement
* None (Storage operations occur entirely on the backend).

### Test Command
* Run E2E tests:
  ```bash
  npx playwright test
  ```
* Perform a manual test: Log in, go to `/resume/upload`, upload a PDF resume, and inspect the response. The download/preview file URL should be a signed presigned URL from the cloud bucket.

### Rollback Steps
* Remove bucket environment keys or set `STORAGE_PROVIDER=local` in the Render environment dashboard. Save and redeploy. Uploads will fallback to the local disk directory.

### Common Errors
* `InvalidAccessKeyId` / `SignatureDoesNotMatch`: Verify access key and secret access key.
* `NoSuchBucket`: Check that the bucket name matches exactly and is created in the specified region.
* `AccessDenied`: Verify that the IAM user policy grants `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions for the bucket.

### Security Notes
* Ensure public access to the bucket is blocked. The bucket must remain private. Access links must only be obtained dynamically via temporary pre-signed URLs with a 15-minute expiration limit.

---

## ✉️ 2. Candidate Account Recovery (SendGrid/SMTP)

### Account Console Link Name
* SendGrid Customer Portal or SMTP Mail Server Dashboard

### Required Env Vars
* `EMAIL_PROVIDER` (set to `sendgrid` or `smtp`)
* `EMAIL_FROM`
* `SENDGRID_API_KEY` (if using SendGrid)
* `SMTP_HOST` (if using SMTP)
* `SMTP_PORT` (if using SMTP)
* `SMTP_USER` (if using SMTP)
* `SMTP_PASS` (if using SMTP)

### Render Placement
* Add variables in the **Environment** tab of the backend Web Service dashboard.

### Vercel Placement
* None.

### Test Command
* Navigate to `/auth/forgot-password`, enter your email, submit, and confirm that the recovery email is delivered.

### Rollback Steps
* Remove email environment keys or set `EMAIL_PROVIDER=mock`. The server logs recovery links to stdout for testing.

### Common Errors
* `Sender Verification Failed` (SendGrid): Ensure the `EMAIL_FROM` variable matches a verified sender domain or single sender in the SendGrid Console.
* `SMTP Connection Timeout` / `Authentication Failed`: Check host name, port (typically 587 or 465), and credentials.

### Security Notes
* All reset tokens are generated securely (32-byte hex tokens), stored using SHA-256 hashes in the database, and automatically expire after 1 hour. Timing scans are prevented via simulated random delays.

---

## 🔑 3. Google OAuth Setup

### Account Console Link Name
* Google Cloud Console (APIs & Services)

### Required Env Vars
* `GOOGLE_CLIENT_ID`
* `GOOGLE_CLIENT_SECRET`
* `GOOGLE_REDIRECT_URI`
* `CLIENT_URL` (points to the frontend URL)

### Render Placement
* Add all variables in the **Environment** tab of the backend Web Service dashboard.

### Vercel Placement
* None.

### Test Command
* Navigate to the login page, verify that the "Continue with Google" button is active (no longer disabled with a coming-soon note), and perform a login test.

### Rollback Steps
* Remove `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from the Render environment dashboard. The frontend sign-in button will automatically disable.

### Common Errors
* `redirect_uri_mismatch`: Ensure that the `GOOGLE_REDIRECT_URI` configured in Render matches the Authorized Redirect URI in the Google Cloud Console credential settings exactly.

### Security Notes
* Configure only `openid`, `email`, and `profile` OAuth scopes. Do not request extra write scopes. JWT session handoff should be migrated to HttpOnly cookies as a P0 follow-up.

---

## 🤖 4. AI Engine Setup (OpenAI/Gemini)

### Account Console Link Name
* OpenAI Developer Platform or Google AI Studio Dashboard

### Required Env Vars
* `OPENAI_API_KEY` (for OpenAI)
* `GEMINI_API_KEY` (for Gemini)
* `AI_PROVIDER` (set to `openai` or `gemini`)

### Render Placement
* Add variables in the **Environment** tab of the backend Web Service dashboard.

### Vercel Placement
* None.

### Test Command
* Analyze a resume on the analyzer page and check if recommendations are personalized.

### Rollback Steps
* Remove AI keys from the Render environment dashboard. The backend will automatically fall back to mock templates.

### Common Errors
* `QuotaExceeded` / `RateLimitError`: Verify API billing status and model limits.
* `InvalidApiKey`: Check the API key format.

### Security Notes
* Enable candidate-side anonymization controls (`anonymizeForAnalysis`) to strip PII before forwarding payloads to external LLM endpoints.

---

## 💳 5. Stripe Setup (Future Subscription)

### Account Console Link Name
* Stripe Dashboard

### Required Env Vars
* `STRIPE_SECRET_KEY`
* `STRIPE_PUBLISHABLE_KEY`
* `STRIPE_WEBHOOK_SECRET`
* `STRIPE_PRICE_PRO`
* `STRIPE_PRICE_PREMIUM`
* `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Frontend)

### Render Placement
* Add variables in the **Environment** tab of the backend Web Service dashboard.

### Vercel Placement
* Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Vercel project environment variables.

### Test Command
* Initiate a checkout session in sandbox mode using Stripe test cards. Verify that the webhook completes and sets the user's role to pro or premium in the database.

### Rollback Steps
* Remove all Stripe keys from the dashboards. Billing will revert to mock mode where users can mock upgrade.

### Common Errors
* `Webhook Signature Verification Failed`: Ensure that the `STRIPE_WEBHOOK_SECRET` matches the signing secret displayed in the Stripe Webhooks panel.

### Security Notes
* Webhook requests must always pass signature verification. Stripe publishable keys are public, but secret keys and signing secrets must never be exposed.

---

## 💼 6. Job Board Partner Setup (Future Live Search)

### Account Console Link Name
* LinkedIn Developer Portal, Indeed Publisher Portal, Naukri Recruiter Portal, ZipRecruiter API Dashboard, or Dice Employer Portal

### Required Env Vars
* `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` (LinkedIn)
* `INDEED_API_KEY` (Indeed)
* `ZIPRECRUITER_API_KEY` (ZipRecruiter)
* `DICE_API_KEY` (Dice)
* `NAUKRI_API_KEY` (Naukri)

### Render Placement
* Add variables in the **Environment** tab of the backend Web Service dashboard.

### Vercel Placement
* None.

### Test Command
* Open the job search panel. Filter by source and verify that live partner postings are loaded.

### Rollback Steps
* Remove board API variables from the Render dashboard. The system falls back to seeded job database entries.

### Common Errors
* `Authorization Expired` / `Invalid API Key`: Job Board API partners require periodic credential rotation or contract renewal.

### Security Notes
* Protected scraping of listings is completely disabled to remain terms-compliant. All applications must be manually reviewed and verified by the candidate before submission; automated auto-applying is disabled.
