# Provider Integrations

AI Job Copilot is provider-ready. Live external integrations must be enabled only with approved credentials and terms-compliant access. The **UI status page** is available at `/settings/integrations` in the app.

> **Safety rule**: Do not mark any provider as Live in code or docs unless real env vars are set and the connection is tested. Keep honest provider-ready status until then.

---

## Integration Status Overview

| Provider | Category | Status | Key Feature Unlocked |
|----------|----------|--------|----------------------|
| OpenAI / Gemini AI | AI | Provider-ready | ATS analysis, cover letter, mock interview, chat |
| MongoDB Atlas | Database | Required | All data persistence |
| LinkedIn Jobs API | Job Boards | Provider-ready | Live job listings |
| Indeed Publisher | Job Boards | Provider-ready | Live job feed |
| Naukri API | Job Boards | Provider-ready | India-centric job feed |
| ZipRecruiter | Job Boards | Provider-ready | US job listings |
| Dice API | Job Boards | Provider-ready | Tech-focused job listings |
| Google OAuth | Auth | Provider-ready | One-click sign-in |
| SendGrid / SMTP | Notifications | Provider-ready | Email alerts and reminders |
| Stripe | Payments | Provider-ready | Subscriptions, invoicing |
| AWS S3 / R2 | Storage | Provider-ready | Resume, portfolio PDF, screenshot, proof file, and owner-only archive storage |
| File Scanning Provider | Security | Local validation / Provider-ready | Malware scanning boundary for portfolio proof files |
| Google Calendar | Calendar | Provider-ready | Interview reminders |
| Coursera / Udemy | Courses | Provider-ready | Skill gap course links |
| GitHub API | Dev Tools | Provider-ready / manual fallback | Portfolio proof verification and project analyzer |
| Chrome Extension | Browser | Provider-ready | Job capture from boards |
| Portfolio custom domains | Hosting | Provider-ready only | Optional custom domains for public portfolio slugs |

---

## AI Provider

Resume analysis, cover letter generation, mock interview, career mentor chat, and skill roadmap use AI provider calls.

**Status**: Provider-ready. Falls back to structured mock output when key is missing.

**Required env vars (backend .env)**:
```
OPENAI_API_KEY=
# OR
GEMINI_API_KEY=
AI_PROVIDER=openai   # or gemini
```

**Setup steps**:
1. Create an account at [platform.openai.com](https://platform.openai.com) or [aistudio.google.com](https://aistudio.google.com).
2. Generate an API key.
3. Add it to `backend/.env`.
4. Set `AI_PROVIDER` to `openai` or `gemini`.
5. Restart the backend.

**Safety note**: Raw prompts and API keys are never logged. Resume content is optionally anonymized before AI requests (controlled by `anonymizeForAnalysis` toggle).

---

## Database

MongoDB Atlas is required for all data persistence. The backend will fail to start without a valid connection string.

**Required env vars**:
```
MONGODB_URI=mongodb+srv://...
```

**Setup steps**:
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas).
2. Add a database user.
3. Allow your IP or set `0.0.0.0/0` for Render.
4. Copy the connection string and set `MONGODB_URI`.

---

## Job Boards

The backend exposes `GET /api/jobs/sources` to show configured local sources and external provider readiness.

**Rules**:
- Use official APIs, partner feeds, CSV imports, or user-provided official company career URLs.
- Do not scrape protected job boards or bypass terms of service.
- Do not auto-apply or auto-message recruiters without explicit user review.

**Required env vars**:
```
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=
INDEED_API_KEY=
ZIPRECRUITER_API_KEY=
DICE_API_KEY=
NAUKRI_API_KEY=
```

**Setup steps per board**:

- **LinkedIn**: Apply for [LinkedIn Jobs API](https://developer.linkedin.com) partner access. May take weeks for approval.
- **Indeed**: Sign up at [indeed.com/publisher](https://www.indeed.com/publisher). Set publisher ID.
- **Naukri**: Contact Naukri partner team for API access.
- **ZipRecruiter**: Apply at [ziprecruiter.com/api](https://www.ziprecruiter.com/api).
- **Dice**: Contact Dice for feed/API credentials.

---

## Auth Providers

**Google OAuth**

Required env vars (backend):
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
CLIENT_URL=
```

**Status**: 
- **Live**: Enabled dynamically when valid credentials are set and tested.
- **Provider-ready**: Displayed when placeholders exist in the environment but values are missing.
- **Not configured**: Displayed when environment variable keys are completely absent.

Setup: Create OAuth 2.0 credentials at [console.cloud.google.com](https://console.cloud.google.com). Add authorized redirect URIs. See [google-oauth-activation.md](google-oauth-activation.md) for full setup instructions.

**Safety note**: Only request `openid`, `email`, and `profile` scopes. Never store OAuth tokens in logs. Exposing JWTs in URL callback parameters is a known security risk; transition to HttpOnly cookies is planned as a P0 follow-up.

---

## Email / Notifications

Transactional emails for account recovery (forgot/reset password) and interview alerts.

**Status**: Provider-ready. Enabled dynamically in `/settings/integrations` and recovery forms. Falls back gracefully to standard console logging in mock/dev mode.

**Required env vars**:
```ini
EMAIL_PROVIDER=sendgrid   # or smtp
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=
# OR use SMTP:
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

**SendGrid Setup**:
1. Sign up on [SendGrid](https://sendgrid.com).
2. Authenticate your domain or verify single sender under Settings $\to$ Sender Authentication.
3. Generate an API Key under Settings $\to$ API Keys.
4. Set `EMAIL_PROVIDER=sendgrid` and configure `SENDGRID_API_KEY` on Render or in `.env`.
5. Set `EMAIL_FROM` to match your verified SendGrid sender.

**SMTP Setup**:
1. Obtain server host, port (587 or 465), user, and password from your SMTP provider.
2. Set `EMAIL_PROVIDER=smtp`.
3. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in your environment.
4. Set `EMAIL_FROM` with your sender name and email.

**Render Environment Placement**:
1. Navigate to Render Dashboard $\to$ select backend service.
2. Select **Environment** tab $\to$ click **Add Environment Variable**.
3. Add variable keys (`EMAIL_PROVIDER`, `SENDGRID_API_KEY`, etc.).
4. Click **Save Changes** to redeploy service with environment active.

**Provider-ready Fallback Behavior**:
* If email credentials are empty or missing:
  - Disclaimers indicate fallback mode on forgot password page.
  - Reset links are printed to backend server logs.
  - In development mode (`NODE_ENV` is not `production`), the API response also includes the raw token helper to make local developer testing seamless.
  - Non-existing account inquiries simulate identical timeline workloads to prevent email scanning.

**Reset Token Security Notes**:
* Generated securely using `crypto.randomBytes(32)` cryptorandom token.
* Database stores SHA-256 hash representation only.
* Tokens automatically expire 1 hour after generation.
* Tokens are immediately invalidated (cleared) upon successful reset.
* No passwords or reset tokens are exposed in normal application logs.

---

## Payments / Billing

Stripe is used for subscription billing, plan enforcement, and invoices.

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
```

**Setup steps**:
1. Create a [Stripe](https://stripe.com) account.
2. Add `STRIPE_SECRET_KEY` from your dashboard.
3. Create a webhook endpoint pointing to `/api/billing/webhook`.
4. Add `STRIPE_WEBHOOK_SECRET` from the webhook config.
5. No real billing activates until these are set.

**Safety note**: Never commit Stripe keys. Never log payment amounts or card details.

---

## File Storage

Resume files, generated PDFs, portfolio PDFs, screenshots, portfolio proof files, and owner-only proof archive exports are stored through the configured storage provider.

**Required env vars**:
```
STORAGE_PROVIDER=local   # or s3 or r2
STORAGE_BUCKET_NAME=
STORAGE_REGION=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_SIGNED_URL_TTL_SECONDS=900
```

**Current status**: Local fallback by default; S3/R2 is provider-ready until real credentials and bucket access are configured and tested.

Portfolio file metadata is owner-scoped and private by default. The public portfolio route can return file links only when metadata visibility is `publicApproved`.

Portfolio proof file upload:
- Supports user-initiated PNG, JPG/JPEG, WEBP, and PDF uploads.
- Enforces a 5MB size limit.
- Validates MIME type, extension, and file signature.
- Defaults every uploaded file to private metadata.
- Allows owner-controlled visibility changes to `publicApproved`.
- Provides owner-gated signed URL/download refresh and delete/detach actions.
- Does not mark proof as third-party verified.
- Records owner-scoped audit events for upload, validation, visibility, signed URL, attach/detach, and delete actions without file contents.
- Tracks owner-scoped retention status and review status.
- Provides metadata-only export summary for proof files and recent safe audit events.
- Provides owner-only binary archive export for eligible proof files after explicit confirmation.
- Generates short-lived archive download links and never exposes archive storage keys in API responses.
- Hides scheduled-for-delete, deleted, and retained-for-audit files from public portfolios.

Local fallback:
- Uses app-served `/uploads/...` links when the existing app supports the file.
- Is not production-durable.
- Must not be described as private cloud hosting.

S3/R2 provider-ready behavior:
- Stores only storage keys in app records.
- Generates short-lived signed download/view URLs.
- Uses `STORAGE_SIGNED_URL_TTL_SECONDS`, defaulting to `900` seconds.
- Must be verified manually before status is changed to Live.

Never expose absolute local disk paths, private bucket URLs, access keys, secret keys, or internal storage keys in public portfolio output.

### Proof File Audit Trail

**Current status**: Implemented as owner-scoped app data. It does not require an external provider.

The audit trail records file actions and review decisions, including upload, local validation, scan status changes, visibility changes, public approval/revocation, signed URL generation, attachment, detachment, retention review, delete request, delete completion, metadata export request, metadata export generation, and deletion.

It never logs file contents, absolute local paths, private bucket URLs, full signed URLs, query tokens, provider credentials, or private proof notes. Public portfolios never return audit events or event IDs.

### Proof File Retention And Export

**Current status**: Implemented as owner-scoped app data. Binary archive export is implemented for eligible proof files with explicit owner confirmation and short-lived access.

Retention statuses:

- `active`
- `scheduled_for_delete`
- `deleted`
- `retained_for_audit`

Review statuses:

- `not_reviewed`
- `reviewed`
- `needs_attention`

Owner metadata export includes proof-file metadata and recent safe audit summaries. It does not include file contents, signed URL tokens, full signed URLs, private bucket URLs, absolute local paths, storage credentials, or scanner payloads.

Owner binary archive export:

- requires the authenticated owner and portfolio ownership
- requires explicit `confirmExport: true`
- packages only active, scan-eligible, storage-safe proof files
- excludes deleted, scheduled-for-delete, retained-for-audit, blocked, failed, provider-pending, not-scanned, and noneligible files
- stores the archive through the same local/S3/R2 storage abstraction
- uses `STORAGE_SIGNED_URL_TTL_SECONDS`, defaulting to 900 seconds
- never returns archive storage keys, absolute local paths, private bucket URLs, provider credentials, or signed URL secrets in normal API responses
- records safe binary export audit events only

Public portfolio rules:

- Only `active` files can appear.
- Files also need `publicApproved` visibility and public-eligible scan metadata.
- `scheduled_for_delete`, `deleted`, and `retained_for_audit` files are hidden even if older embedded metadata says public-approved.
- archive requests, archive links, archive storage keys, export audit events, and retention internals are never returned by `/u/[slug]`.

---

## File Scanning Provider

Portfolio proof file uploads have a local validation boundary and a provider-ready malware scanning boundary.

**Required env vars (backend)**:

```env
FILE_SCANNING_PROVIDER=
FILE_SCANNING_API_KEY=
FILE_SCANNING_ENDPOINT=
FILE_SCANNING_TIMEOUT_MS=10000
```

**Current status**: Local validation is active by default. Malware scanning is provider-ready only until real credentials are configured and a real provider scan succeeds.

Local validation checks:

- MIME type allowlist.
- File extension allowlist.
- 5MB size limit.
- Executable signature rejection.
- Magic-number/signature validation.

Scan statuses:

- `not_scanned`
- `local_validated`
- `provider_pending`
- `clean`
- `blocked`
- `failed`

Public eligibility:

- `blocked`, `failed`, `provider_pending`, and `not_scanned` files cannot be marked `publicApproved`.
- `/u/[slug]` only receives public-approved files that are also public-eligible.
- A file marked `local_validated` is not provider malware-clean; the UI labels it as local validation.

Setup steps:

1. Choose a malware scanning provider with API terms that allow user-uploaded portfolio files.
2. Add the backend env vars in Render or the backend hosting environment.
3. Upload a safe test file through `/portfolio-generator`.
4. Confirm the scan endpoint returns a real clean result.
5. Only then mark scanning as Live in status docs or operations dashboards.

Safety notes:

- Do not fake `clean` scan results.
- Do not expose scanner payloads, private files, or private bucket URLs.
- Do not publish blocked, failed, pending, or unscanned files on public portfolios.

---

## Portfolio Slug Hosting

Public portfolio slugs are implemented inside the app at `/u/[slug]`.

**Status**: App-level public slugs are implemented. Custom-domain hosting is provider-ready only.

Current behavior:
- Published portfolios can be viewed at `/u/[slug]`.
- Missing, private, or unpublished slugs show a safe unavailable state.
- Public responses are privacy-filtered and do not expose private contact data unless enabled by the user.
- The app does not provision Vercel custom domains or subdomains.

Future optional env placeholders if custom-domain automation is implemented later:

```env
VERCEL_TOKEN=
VERCEL_TEAM_ID=
PORTFOLIO_BASE_DOMAIN=
```

Do not set these as "live" until domain ownership checks, DNS configuration, abuse controls, and verification tests are implemented.

---

## GitHub Proof Verification

GitHub proof verification supports recruiter-facing portfolio evidence without fake metrics.

**Status**: Manual fallback by default; provider-ready for GitHub API metadata when credentials are configured. Mark Live only after a real metadata request succeeds.

**Required env vars (backend)**:

```env
GITHUB_TOKEN=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Current behavior:

- Public GitHub repo URLs can be entered manually in `/portfolio-generator`.
- The backend validates `github.com/owner/repo` URLs and stores a canonical repo URL.
- `/api/portfolios/github/status` reports Live, Provider-ready, Manual fallback, or Not configured honestly.
- `/api/portfolios/github/check` parses owner/repo and returns confidence without inventing stars, forks, commits, contributors, or verification.
- With `GITHUB_TOKEN` configured, the backend can fetch safe public metadata: repo name, description, languages, README presence, last updated date, public URL, default branch, and topics.
- Public `/u/[slug]` shows GitHub proof only when the owner enables the `showGitHubProof` gate.

Setup steps:

1. Create a GitHub fine-grained token with read-only public repository metadata scope, or configure a GitHub OAuth app for future user-consented private repo access.
2. Add `GITHUB_TOKEN` or OAuth client credentials to Render backend environment variables.
3. Restart the backend.
4. Submit a public repository URL from `/portfolio-generator`.
5. Confirm the response includes real metadata before treating the provider as Live.

Safety notes:

- Private repositories require explicit user OAuth consent before access.
- Do not scrape GitHub pages.
- Do not display hidden repo links, private notes, fake stats, fake verification, or provider success claims.

---

## Calendar

Google Calendar integration for interview reminders (provider-ready).

```
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
```

---

## Resume Import And Anonymization

- Upload supports PDF, DOCX, and TXT.
- The analyzer can redact name, email, phone, and links before AI calls (`anonymizeForAnalysis` toggle).
- The local ATS heuristic checks completeness without logging raw content.

---

## Learning Resources

Skill-gap plans work with mock/provider-ready AI fallback. External course metadata should be added only through approved APIs.

```
COURSE_PROVIDER=mock   # or coursera or udemy
COURSERA_API_KEY=
UDEMY_CLIENT_ID=
UDEMY_CLIENT_SECRET=
```

## Observability

Sentry for exception tracking and Better Stack for uptime monitoring.

**Sentry environment variables (backend & frontend)**:
```env
MONITORING_PROVIDER=sentry
SENTRY_DSN=
NEXT_PUBLIC_MONITORING_PROVIDER=sentry
NEXT_PUBLIC_SENTRY_DSN=
```

**Better Stack setup**:
- Register an external uptime HTTP monitor at Better Stack pointing to the backend `/health` endpoint. No secrets are stored in the repo.

---

## Chrome Extension

The browser extension captures job details from job board pages (provider-ready). No scraping of restricted pages.

- Status: Provider-ready
- Requires: Backend running locally or at production URL
- Session bridging requires the user to be logged in to the app

---

## UI Status Page

The in-app **Integrations & Provider Status** page is available at:
`/settings/integrations`

It shows live vs provider-ready status, required env vars, and setup steps for each provider.
