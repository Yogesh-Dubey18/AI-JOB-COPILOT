# Safe Apply Assistant & Integration Roadmap

This document outlines the safety compliance matrix, blocked automation practices, and the development roadmap for external integrations (such as Gmail / SMTP email sync).

---

## 1. Compliance Matrix & Blocked Practices

To align with standard Terms of Service (TOS) of popular job boards (LinkedIn, Indeed, Naukri, ZipRecruiter) and prevent user account bans, the following practices are **strictly prohibited** in the codebase:

| Unsafe Practice | Code Status | Rationale |
|---|---|---|
| **Autonomous Background Auto-Apply** | **BANNED & BLOCKED** | Submitting job applications without review violates portal TOS, compromises accuracy, and leads to account blocks. |
| **Stealth WebDriver Evasion** | **BANNED & BLOCKED** | Suppressing webdriver flags or simulating browser sessions with stealth packages is prohibited. |
| **Residential Proxies / IP Rotation** | **BANNED & BLOCKED** | Residential proxy networks used to bypass scraping limits are unsafe and blocked. |
| **Restricted Web Scraping** | **BANNED & BLOCKED** | Bypassing bot protection (Cloudflare, Akamai) on job boards is disabled. All external job feeds require official partner API keys. |

### Safer Alternative Implemented: Review-First Copy-Fill Helper
Instead of background bots, the **Apply Assistant Workspace** presents a centralized manual helper where candidates can:
1. Fetch tailored drafts in tone-based outputs.
2. Select and link recruiter contacts from their local CRM.
3. Review and edit responses inline.
4. Copy details manually into application forms, maintaining 100% human-in-the-loop validation.

---

## 2. CRM Recruiter Linking Status

The platform features a complete local contacts CRM:
* **Recruiter Registry**: Log name, company, email, phone, and notes for key recruitment stakeholders.
* **Link to Applications**: Applications can be linked to a single recruiter contact from the CRM.
* **Activity Tracking**: Saving drafts and editing answers logs activity directly to the application tracker timeline, keeping a clear historical record.

---

## 3. Remaining Email / Gmail Integration Steps

Gmail/Email integration is currently marked as **Provider-Ready (Mock Fallback)**. To transition it to a live production state, the following steps must be completed:

### A. Gmail OAuth Activation
1. **Google Cloud Console**:
   - Register a project on the Google Cloud Console.
   - Enable the Gmail API.
   - Configure the OAuth consent screen with the required scopes (`https://www.googleapis.com/auth/gmail.send`, `https://www.googleapis.com/auth/gmail.readonly`).
2. **Environment Configuration**:
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the backend environment.
   - Configure redirect URIs pointing to `/api/auth/google/callback`.
3. **Backend Middleware Integration**:
   - Establish OAuth credentials handling on user login, requesting offline token refresh access.

### B. SMTP / SendGrid Verification
1. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in the backend `.env` file.
2. For SendGrid, set `SENDGRID_API_KEY` and verify your sender identity.
3. Update transactional emails to route through authenticated transports, replacing mock logs.
