# Provider Integrations

AI Job Copilot is provider-ready, but live external integrations must be enabled only with approved credentials and terms-compliant access.

## Job Boards

The backend exposes `GET /api/jobs/sources` to show configured local sources and external provider readiness for LinkedIn, Indeed, ZipRecruiter, Dice, and Naukri.

Rules:

- Use official APIs, partner feeds, CSV imports, or user-provided official company career URLs.
- Do not scrape protected job boards or bypass terms of service.
- Do not auto-apply or auto-message recruiters without explicit user review.

Required placeholders:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`
- `INDEED_API_KEY`
- `ZIPRECRUITER_API_KEY`
- `DICE_API_KEY`
- `NAUKRI_API_KEY`

## Resume Import And Storage

Resume upload supports PDF, DOCX, and TXT with safe local fallback parsing. Production deployments should move uploaded files from local disk to an approved object store.

Required placeholders:

- `STORAGE_PROVIDER`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

Bias-mitigation support:

- The upload flow can generate an anonymized parsed preview.
- The analyzer can redact name, email, phone, and links before sending content to AI providers.
- The local ATS heuristic still checks resume completeness without logging secrets or raw prompts.

## Learning Resources

Skill-gap plans work with mock/provider-ready AI fallback. External course metadata should be added only through approved APIs.

Required placeholders:

- `COURSE_PROVIDER`
- `COURSERA_API_KEY`
- `UDEMY_CLIENT_ID`
- `UDEMY_CLIENT_SECRET`

## OAuth

Google and LinkedIn OAuth are placeholder-ready. Do not request broad scopes. Only request data needed for authentication or user-approved profile import.

Required placeholders:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

