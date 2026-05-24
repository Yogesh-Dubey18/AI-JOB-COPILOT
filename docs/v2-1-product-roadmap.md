# AI Job Copilot v2.1 Product Roadmap

This document outlines the engineering priorities, effort estimates, technical risks, dependencies, and recommended scheduling order for the next iteration (v2.1) of the platform.

---

## 🎯 Prioritization Framework

We classify roadmap items based on the following priorities:
- **P0 - Blocker / Release Critical:** Security audits, live environment integrations, critical bugfixes.
- **P1 - Core Value Add:** Core features and UI quality upgrades that improve job matching and user experience.
- **P2 - Expansion / Premium features:** Non-blocking additions, billing integrations, and localization support.

---

## 🚀 P0 Milestone: Release Hardening & Verification (Milestone 1)

These issues are required to transition the application from a "provider-ready" beta sandbox to a secure, stable production SaaS. Based on the first Open Beta feedback loop, the priorities are ordered as follows:

### 1. P0-1: Storage & Upload Hardening
- **Description:** Move resume file uploads from the ephemeral local server disk to a secure private AWS S3 or Cloudflare R2 bucket. Implement server-side binary signature (magic number) verification for `%PDF` and `PK..` headers to reject executable payloads.
- **Effort Estimate:** Medium (2 days)
- **Risk:** Intermittent upload failures if endpoint permissions are misconfigured.
- **Dependencies:** Private AWS / R2 bucket access credentials.
- **Recommended Order:** 1

### 2. P0-2: Google OAuth Activation
- **Description:** Transition the disabled "Continue with Google" placeholder button into a functional login flow. Configure real OAuth consent scopes and client credentials in the Google Cloud Console.
- **Effort Estimate:** Medium (1 day)
- **Risk:** User login failure if redirect URIs clash in production.
- **Dependencies:** Google Cloud Console developer account setup.
- **Recommended Order:** 2

### 3. P0-3: Playwright E2E Verification
- **Description:** Install Playwright, build test scenarios covering user registration, login, ATS resume parsing, and tracker state changes, and integrate checks into the CI/CD pipeline.
- **Effort Estimate:** High (3 days)
- **Risk:** Headless browser execution delays or flaky test runners.
- **Dependencies:** Stable local database seeds.
- **Recommended Order:** 3

### 4. Provider Key Activation (AI, Email)
- **Description:** Replace sandbox mock clients with live API integrations for OpenAI/Gemini and SendGrid.
- **Effort Estimate:** Medium (1-2 days)
- **Dependencies:** Provider account configurations and billing alerts.
- **Recommended Order:** 4

### 5. Auth/Session Audit
- **Description:** Conduct security audit on JWT signature algorithms and session cookies.
- **Effort Estimate:** Medium (2 days)
- **Recommended Order:** 5

---

## 📈 P1 Milestone: AI Intelligence & CRM Polish (Milestone 2)

### 6. Advanced AI Resume Tailoring
- **Description:** Upgrade ATS scanner prompts to provide inline modification suggestions instead of high-level score descriptions.
- **Effort Estimate:** Medium (2 days)
- **Risk:** Hallucinations on resume facts.
- **Dependencies:** Active OpenAI/Gemini key.
- **Recommended Order:** 6

### 7. Live Job Providers
- **Description:** Pull live listings from Indeed Publisher or LinkedIn API endpoints.
- **Effort Estimate:** High (4–5 days)
- **Risk:** API key cancellations or rate limiting.
- **Dependencies:** Approved publisher/partner access.
- **Recommended Order:** 7

### 8. Analytics & Reminders Hardening
- **Description:** Add Cron Jobs to scan database daily for stale application cards (e.g., > 14 days without update) and dispatch email notifications.
- **Effort Estimate:** Medium (2 days)
- **Risk:** Email spamming if trigger schedules misfire.
- **Dependencies:** Active SendGrid/SMTP credentials.
- **Recommended Order:** 8

### 9. Chrome Extension Upgrades
- **Description:** Support parsing on target boards (e.g. greenhouse, lever) and sync cookies to bypass manual auth credential logins in the extension.
- **Effort Estimate:** High (3 days)
- **Risk:** Chrome Web Store policy review delays.
- **Dependencies:** Manifest V3 rules.
- **Recommended Order:** 9

---

## 🌟 P2 Milestone: Recruiter & Monetization Upgrades (Milestone 3)

### 10. Recruiter Portal Backend
- **Description:** Implement backend schemas for verification, candidate profiles search, and candidate contact request credits tracking.
- **Effort Estimate:** High (5 days)
- **Risk:** Candidate privacy concerns / compliance laws (GDPR/DPDPA).
- **Dependencies:** Stripe billing integration.
- **Recommended Order:** 10

### 11. Public Portfolio Hosting
- **Description:** Enable users to publish portfolios on a customizable subdomain (e.g. `username.aijobcopilot.com`) with clean layouts.
- **Effort Estimate:** Medium (3 days)
- **Risk:** Domain spoofing or hosting malicious scripts.
- **Dependencies:** Vercel Wildcard domain configuration.
- **Recommended Order:** 11

### 12. Stripe Subscriptions Integration
- **Description:** Bind user plans (Pro/Premium) to Stripe webhook events, enforcing limits on resume parsing count and kit generations.
- **Effort Estimate:** Medium (3 days)
- **Risk:** Sync lag between Stripe checkout webhooks and DB state updates.
- **Dependencies:** Verified Stripe account.
- **Recommended Order:** 12
