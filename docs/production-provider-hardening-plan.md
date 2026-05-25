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
Set the following keys in your backend `.env` to enable cloud storage:
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
2. **Account Enumeration Defense**: The server always returns `{ success: true, message: "If the account exists..." }`, preventing bots from scanning registered emails.
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

---

## 🔐 3. Google OAuth Manual Activation Checklist

Google OAuth sign-in remains disabled inside Candidate Auth forms unless Google OAuth variables are set.

### Activation Checklist
1. **Google Cloud Console Setup**:
   - Create a project on the [Google Cloud Console](https://console.cloud.google.com).
   - Configure the OAuth Consent Screen (External, specify support emails, add scopes `email` and `profile`).
2. **Client Credentials**:
   - Go to Credentials $\to$ Create Credentials $\to$ OAuth client ID (Web application).
   - Add Authorized JavaScript Origins:
     - Development: `http://localhost:3000`, `http://localhost:5000`
     - Production: `https://ai-job-copilot-frontend.vercel.app`, `https://ai-job-copilot-backend-l6ut.onrender.com`
   - Add Authorized Redirect URIs:
     - Development: `http://localhost:5000/api/auth/google/callback`
     - Production: `https://ai-job-copilot-backend-l6ut.onrender.com/api/auth/google/callback`
3. **Environment Setup**:
   - Save client credentials to backend variables:
     ```ini
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     GOOGLE_REDIRECT_URI=https://ai-job-copilot-backend-l6ut.onrender.com/api/auth/google/callback
     ```
   - Restart the server. The Google OAuth button will automatically transition from disabled "coming soon" to active.

---

## 🚨 4. Rollback and Disaster Recovery

If storage or auth providers encounter failures in production:
1. **Storage Failure**:
   - Set `STORAGE_PROVIDER=local` on the host.
   - Restart backend service. Multer uploads and PDF exports will resume local directory storage immediately.
2. **Email Failures**:
   - Reset `EMAIL_PROVIDER=mock`.
   - All password reset token links will be written to standard console stdout logs for manual administrator copying.

---

## 🔬 5. Testing Verification Checklist

Run these validation commands prior to tags or release promotions:
1. **Local fallback checks**: Run backend tests to verify filesystem reads/writes.
2. **Signature checks**: Verify that non-PDF payloads are rejected during resume upload validation.
3. **Security audit**: Ensure no keys or raw passwords are saved in files, logs, or response buffers.
