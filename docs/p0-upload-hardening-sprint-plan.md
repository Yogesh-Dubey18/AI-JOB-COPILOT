# P0 Upload Hardening Sprint Plan

This plan details the technical specifications, risks, security requirements, and implementation path for hardening the resume upload system in **AI Job Copilot**.

---

## ⚠️ Current Upload/Storage Mode & Risks

### Current Configuration
* **Storage Mode:** Local server disk storage. Uploaded PDFs/DOCXs are stored in a local directory on the backend server under `uploads/` using `multer` file system write actions.
* **Validation:** Restricted to client-side MIME checks and basic backend filename extension checks.

### Security Risks
1. **Remote Code Execution (RCE):** Filename extension checks can be bypassed. An attacker could upload a malicious executable or script (e.g. `.exe`, `.js`, `.sh`, `.php`) disguised as a PDF or by exploit injection, leading to shell execution on the host machine.
2. **Denial of Service (DoS):** Local disks have limited capacity. A flood of large uploads can fill up the disk storage, crashing both the backend database connection and the web server.
3. **Ephemeral File Loss:** Render container deployments are ephemeral. Whenever a new commit is deployed or the container restarts, all locally stored resumes are wiped out, breaking user document access.
4. **Data Privacy Leakage:** Files stored on local disk can be accidentally exposed to web server directory listings if permissions are misconfigured.

---

## 🛡️ Target Security Architecture

### 1. S3 / R2-Compatible Cloud Storage
* **Destination:** All files will be streamed directly to an AWS S3 or Cloudflare R2 object storage bucket.
* **Configuration:** The local disk fallback will be completely replaced by an S3 upload stream (using `@aws-sdk/client-s3` or similar SDK client).
* **Signed URLs:** To prevent unauthorized file downloads, all resumes in S3 will have private access policies. The backend will generate temporary **Signed GET URLs** (expiring in 15 minutes) only for authenticated users requesting their own files.

### 2. Strict Magic Number File Validation
Instead of checking MIME type or extension name, the backend will inspect the file's binary signature (first few bytes) to verify the actual file type:
* **PDF Signature:** Must start with the bytes `25 50 44 46` (ASCII: `%PDF`).
* **DOCX (ZIP format) Signature:** Must start with the bytes `50 4B 03 04` (ASCII: `PK..`).
* **Implementation Plan:** Use a library like `file-type` or read the initial buffer chunk manually to match these hex headers. If the bytes do not match `%PDF` or `PK..`, the file is immediately rejected before S3 streaming.

### 3. File Limitations & Malware Rejection
* **Size Limit:** Strictly enforced at **5MB** maximum on the backend.
* **Malware Prevention:** Arbitrary headers, macros, or active script elements inside PDFs/DOCXs will trigger validation failures. Filenames will be completely randomized (using UUID v4) to prevent path traversal directory attacks.

### 4. Metadata and Data Erasure
* **Database Model:** Only randomly generated file keys and bucket locations are saved to the user's document schema in MongoDB. No private details are embedded.
* **Erasure Compliance (GDPR/DPDPA):** When a user requests account deletion, the backend must trigger an asynchronous delete call to S3/R2 (`DeleteObject`) to permanently erase the document from the bucket.

---

## ⚙️ Environment Variables Required

The following configuration variables must be set in the backend environment (e.g. Render dashboard or local `.env.example` file) without committing any real secrets:

```env
# Storage Provider Config (S3 / R2)
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your_access_key_placeholder
AWS_SECRET_ACCESS_KEY=your_secret_key_placeholder
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=ai-job-copilot-resumes
# Optional Custom S3 Endpoint (for Cloudflare R2 / MinIO)
AWS_S3_ENDPOINT=https://your-r2-account-id.r2.cloudflarestorage.com
```

---

## 🚀 Migration & Verification Plan [COMPLETED]

### Phase 1: Local Development Magic Numbers & PDF Parser [COMPLETED]
- Integrated strict binary magic-number checks in `backend/src/services/file-validation.service.ts` for PDF (`%PDF`) and DOCX (`PK\x03\x04`), and binary content sanitization for TXT.
- Upgraded PDF parser to use the native `pdf-parse` (v2.x ESM) library for high-accuracy local text parsing.
- Implemented automatic unlinking of invalid temporary uploads from local disk.

### Phase 2: Test Suite Additions [COMPLETED]
- Wrote integration tests in `backend/tests/api.test.ts` verifying:
  - Rejection of fake PDF resumes (bad magic numbers) with HTTP 400.
  - Rejection of executable files (starting with MZ/ELF) with HTTP 400.
  - Rejection of oversized (> 5MB) resume files with HTTP 400 (mapped from Multer error).

### Phase 3: Rollback Plan
* **Trigger:** If S3 connection timeouts or access denials break the resume upload flow for > 15 minutes.
* **Protocol:** Revert storage client configuration to the local disk writer fallback branch. Keep the binary magic number validation checks active as they do not depend on S3 connectivity.

