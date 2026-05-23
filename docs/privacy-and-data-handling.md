# Privacy and Data Handling

AI Job Copilot collects and processes personal data to provide job search, resume analysis, and career assistance features. This document outlines what data is collected, how it is used, and what controls exist.

## What data is collected

| Data Type | Purpose | Where Stored |
|-----------|---------|--------------|
| Email and password hash | Authentication | MongoDB (bcrypt-hashed) |
| Resume content (text) | ATS analysis, tailoring, AI features | MongoDB |
| Resume files | PDF/DOCX storage | Local server or S3 (provider-ready) |
| Job applications | Tracking and Kanban pipeline | MongoDB |
| Interviews and answers | Prep and scheduling | MongoDB |
| Company research notes | Reference for targeting | MongoDB |
| Contact CRM entries | Recruiter and networking tracking | MongoDB |
| AI-generated content | Cover letters, kit, mentor chat | MongoDB (user-controlled) |
| Career vault entries | Work history and achievements | MongoDB |
| Answer vault entries | Interview answer bank | MongoDB |

## What data is NOT collected

- Payment card data (never stored; Stripe handles this)
- Government IDs or financial records
- Biometric data
- GPS or device location
- Social media login tokens (Google OAuth is provider-ready only)

## AI and third-party providers

- AI features (resume analysis, cover letters, skill gap) use **OpenAI or Google Gemini** APIs
- Resume content and job descriptions are sent to the AI provider when you use AI features
- Third-party job board APIs (LinkedIn, Indeed, etc.) are **provider-ready** only — no data is sent to them unless credentials are configured

## Data retention

- User data is retained until the user deletes their account
- No automatic data expiry currently implemented (v2 beta scope)
- AI prompt/response logs are not persisted beyond the session response

## User controls

- Users can delete their resume versions from the Resume section
- Users can delete individual job applications, contacts, and vault entries
- Account deletion is available via the Settings page (backend endpoint `/api/auth/delete-account`)

## Security practices

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 7 days
- All API routes require authentication (auth middleware)
- CORS is restricted to the configured frontend origin
- No secrets are committed to the repository (see `.env.example`)
- File uploads are validated for type and size

## Compliance notes

- This is a **v2 beta** product — full GDPR/DPDPA compliance review is recommended before public launch
- No cookie consent banner is implemented yet (required for EU users)
- No data processing agreement with AI providers exists at beta stage

## Contact

For data requests or deletion: raise an issue on [GitHub](https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT) or contact the maintainer directly.
