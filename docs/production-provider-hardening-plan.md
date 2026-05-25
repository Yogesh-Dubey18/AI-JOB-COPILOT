# Production Provider Hardening Plan

This document outlines the architecture, manual setup instructions, security considerations, and verification procedures for S3/R2 storage integration, candidate account recovery, and Google OAuth authentication within the **AI Job Copilot** ecosystem.

---

## 📦 1. S3/R2 Private Storage Hardening

AI Job Copilot abstracts resume uploads and generated PDFs using a unified storage service.

### Storage Modes
1. **Local Fallback Mode (`STORAGE_PROVIDER=local`)**:
   - Files are written to the local ignored `/uploads/` directory on disk.
   - Ideal for local development, staging tests, or single-container deployments without persistent cloud storage.
   - Public URLs are generated relative to the host (e.g. `/uploads/resumes/userId/file.pdf`).
2. **S3/R2 provider-ready Mode (`STORAGE_PROVIDER=s3` or `r2`)**:
   - Files are sent directly to AWS S3 or Cloudflare R2 bucket destinations.
   - Public access to the bucket must remain **blocked**. All downloads require candidate authentication and signed URLs.
   - Temporary signed URLs are generated dynamically on-the-fly with a default 15-minute TTL (Time To Live).

### Configuration Variables
Set the following keys in your backend environment to enable cloud storage:
```ini
STORAGE_PROVIDER=s3   # s3 or r2
STORAGE_BUCKET_NAME=your-bucket-name
STORAGE_REGION=us-east-1
STORAGE_ENDPOINT=https://your-r2-endpoint.cloudflarestorage.com  # Required for R2
STORAGE_ACCESS_KEY_ID=your-access-key-id
STORAGE_SECRET_ACCESS_KEY=your-secret-access-key
STORAGE_SIGNED_URL_TTL_SECONDS=900
```

### Security Hardening Notes
* **Zero Absolute Disk Paths**: Frontend clients receive temporary signed URLs only. Absolute path directories on local servers are never exposed.
* **Multipart Magic Verification**: File signatures are validated against hex headers (`%PDF` and `PK`) prior to bucket storage.
* **Auto-clean**: Multer temporary uploads are automatically unlinked (`fs.unlink`) immediately after cloud upload completes.

---

## ✉️ 2. Candidate Account Recovery (Forgot/Reset Password)

### Flow Overview
1. **Forgot Request**: Candidates request recovery by entering their email address.
2. **Account Enumeration Defense**: The server always returns `{ success: true, message: "If the account exists..." }`, preventing bots from scanning registered emails. Timing analysis is mitigated via artificial random delays on invalid emails.
3. **Secure Tokens**: The server generates a random 32-byte hex token, hashes it using SHA-256 before saving to Mongoose (`passwordResetTokenHash`), sets `passwordResetExpires` (1 hour limit), and sends the link.
4. **Validation**: During reset, the incoming token is hashed and matched. If found and unexpired, the new password is validated against registering schemas and updated.

### Configuration Variables
```ini
EMAIL_PROVIDER=smtp   # smtp or sendgrid
EMAIL_FROM=AI Job Copilot <no-reply@yourdomain.com>
FRONTEND_URL=https://your-app.vercel.app

# SendGrid credentials
SENDGRID_API_KEY=SG.your-key-here

# SMTP credentials
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-smtp-password
```

### Setup Steps

#### SendGrid Setup
1. **Create Account**: Register a free/paid account on [SendGrid](https://sendgrid.com).
2. **Sender Authentication**: Set up Single Sender Verification or Domain Authentication under Settings $\to$ Sender Authentication.
3. **Generate API Key**: Go to Settings $\to$ API Keys, click "Create API Key" with full or restricted Mail Send access.
4. **Add Env Variable**: Save the generated key as `SENDGRID_API_KEY` on your backend.
5. **Set Sender**: Set `EMAIL_FROM` matching your verified SendGrid sender address/domain.

#### SMTP Setup
1. **SMTP Details**: Obtain SMTP Server Host, Port (587 or 465), Username, and Password from your email client provider (e.g. Mailgun, SES, Sendinblue, Gmail App Password).
2. **Add Env Variables**: Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` to the backend variables.
3. **Set Sender**: Set `EMAIL_FROM` representing the correct sender identity.

---

## 🚀 3. Environment Placement on Render
To deploy these environment variables to the live backend hosted on Render:
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Select your **Web Service** corresponding to the backend service (`ai-job-copilot-backend`).
3. Click on the **Environment** tab on the left navigation menu.
4. Click **Add Environment Variable** to add the placeholders and values:
   - `EMAIL_PROVIDER`
   - `SENDGRID_API_KEY`
   - `EMAIL_FROM`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `CLIENT_URL` (points to the frontend Vercel URL)
5. Click **Save Changes**. Render will automatically trigger a new zero-downtime rolling deployment with the new configurations loaded.

---

## 🛠️ 4. Fallback and Disaster Recovery

### Provider-ready Fallback Behavior
* **Local Fallback**: When `EMAIL_PROVIDER=mock` or API keys are missing/not configured:
  - Safe disclaimers are shown on the frontend.
  - Reset links containing the raw token are printed directly to backend `stdout` logs for manual copying by administrators.
  - In development environments (`NODE_ENV` is not `production`), the API response returns the reset token in a helper payload field so local developers can test the recovery flow instantly.
  - Timing analysis is prevented by running synthetic random delays for non-existing users.
* **No Secret Leaking**: Plaintext passwords and raw reset tokens are never saved to the database. Only SHA-256 hashed tokens are stored.

### Rollback Plan
If email or storage services experience outages:
1. **Email Failure**: Set `EMAIL_PROVIDER=mock` in backend configuration and redeploy/restart. Service defaults to local console logging.
2. **Storage Failure**: Set `STORAGE_PROVIDER=local` in backend configuration. Uploads and exports revert to the local uploads directory.

---

## 🔬 5. Testing Verification Checklist

Prior to launching Phase B to production, execute the following checklist:
- [x] **Generic Response Test**: Verify `/auth/forgot-password` returns same generic message for existing/non-existing emails.
- [x] **Timing Attack Defense**: Confirm delays prevent bots from guessing valid account addresses.
- [x] **No Token Exposure**: Verify `/forgot-password` does not expose the reset token in production mode responses.
- [x] **Hashed Storage**: Verify only SHA-256 hashed tokens exist in Mongoose records.
- [x] **Validation Rules**: Ensure passwords under 8 characters, missing uppercase, lowercase, or digits are rejected during reset.
- [x] **Invalid/Expired Rejection**: Verify expired and invalid tokens fail with 400 Bad Request error.
- [x] **Token Invalidation**: Confirm reset token fields are cleared in MongoDB upon successful update.
- [x] **Mock Fallback**: Verify missing keys default to mock logs and do not crash the service.
- [x] **Build & Test Success**: Run `npm run ci:verify` and confirm all tests compile and pass.
