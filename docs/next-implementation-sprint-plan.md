# AI Job Copilot — Next Implementation Sprint Plan

This document details the step-by-step sprint execution plan for the next 5 cycles of stabilization, security hardening, E2E testing, and commerce integration.

---

## 🏃 Sprint Roadmap

```
+---------------------------------------------------------------------------------------------------+
|  Sprint 1: Security & Aliases  -->  Sprint 2: E2E Testing  -->  Sprint 3: Exporters & Tailoring  |
|                                                                                                   |
|  Sprint 4: Extension & Import  -->  Sprint 5: Stripe Billing & Plan Enforcements                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 📅 Sprint Details

### Sprint 1: Security Hardening & Route Aliases (Stabilization)
* **Goal**: Establish private file storage, secure Google OAuth redirection, remove default fake-looking numbers from empty states, and handle missing routes.
* **Scope**:
  - Implement private storage uploads inside `storage.service.ts` for AWS S3 / Cloudflare R2, configuring signed pre-signed download URLs.
  - Rewrite GET `/api/auth/google/callback` to set session tokens in a secure HttpOnly cookie and redirect cleanly to `/dashboard` instead of query parameter passing.
  - Replace default analytics numbers (`averageAtsScore: 82`) on the frontend with custom empty state graphics.
  - Add Next.js config redirects to map `/tracker` -> `/applications`, `/career-operating-system` -> `/dashboard`, `/interview-prep` -> `/interviews`, and `/skill-roadmap` -> `/skill-gap`.
* **Avoid**: Do not activate real credentials in public git logs; keep configurations in private environment variables.

---

### Sprint 2: E2E Playwright Automation (Testing & CI-CD)
* **Goal**: Install Playwright in CI and verify the complete user registration-to-tracker journey.
* **Scope**:
  - Install `@playwright/test` and setup base configurations.
  - Write test specs verifying:
    - User Registration and Login.
    - Resume upload, magic number validation errors, and text parsing verification.
    - ATS Keyword scanning and suggestion checks.
    - Job discovery filtering and "Save Job" application tracker generation.
    - Answer vault and contacts CRUD operations.
  - Configure GitHub Actions to run E2E scenarios on every PR.
* **Avoid**: Do not use slow sleep timers; write explicit locator element waits.

---

### Sprint 3: Document Exporters & AI Tailoring
* **Goal**: Upgrade resume export quality and tailoring recommendations.
* **Scope**:
  - Integrate a Word processor file generator library (e.g. `docx`) in backend services to export editable Word files alongside PDFs.
  - Enhance ATS prompt configurations to match specific job description bullets, generating inline diff recommendations.
  - Refine PDF stylesheet layouts to guarantee exports cleanly fit single-page margins.
* **Avoid**: Do not let AI templates hallucinate core user details; enforce strict schema boundaries.

---

### Sprint 4: Chrome Extension & Job Board Imports
* **Goal**: Automate job importing from external platforms using the Chrome Extension.
* **Scope**:
  - Sync session cookies between the Chrome extension and the main web app dashboard to bypass manual credential logins.
  - Write parsing scripts within the extension background workers to capture HTML text from active tabs (e.g. Greenhouse, Lever application pages).
  - Mount backend endpoints supporting direct job creation from scraped JSON structures.
* **Avoid**: Do not scrape LinkedIn or Indeed directly to avoid account bans; only parse user-visible tab contents after explicit clicks.

---

### Sprint 5: Stripe Billing & Premium Plans (Monetization)
* **Goal**: Collect payments and enforce usage restrictions.
* **Scope**:
  - Enforce free-tier limits: block resume parsing after 2 monthly uploads and block apply kits after 3 generations.
  - Set up Stripe Checkout routes in the backend, redirecting users to the Stripe billing portal.
  - Mount webhook receivers to process subscription renewals, upgrades, and cancellations, syncing database premium flags.
* **Avoid**: Do not enforce checks on the client side only; validate limits inside the backend controllers.

---

## 🚫 Critical Guidelines — What to Avoid

* **No Credentials In Code**: Never hardcode credentials, API tokens, webhooks keys, or bucket details in repository files.
* **No Auto-Applying**: Do not implement auto-apply bots or recruiter auto-messaging tools. Keep all actions user-reviewed.
* **No Guesswork Parsing**: Do not use regular expressions to parse DOCX binaries. Rely on structural libraries.

---

## 🧪 Testing Checklist

- [ ] **Auth Token Check**: Login via Google OAuth and confirm no token is exposed in the address bar.
- [ ] **Private URL Check**: Copy a resume download URL, wait 16 minutes, and confirm the presigned link returns access denied.
- [ ] **Limit Lock Check**: Set the user parsing count to the limit and confirm the backend blocks further uploads with HTTP 403.
- [ ] **Redirect Check**: Visit `/tracker` logged in and verify seamless redirection to `/applications`.

---

## 🐙 Commit & Git Strategy

* **Atomic Commits**: Each commit must contain a single logical task.
* **Commit Prefix Standards**:
  - `feat:` for new capabilities.
  - `fix:` for bug fixes.
  - `security:` for storage or auth hardening.
  - `test:` for test specs or Playwright scripts.
  - `docs:` for markdown guides.
* **PR Gating**: Every branch must pass local TypeScript compilation and lint checks before pushing.
