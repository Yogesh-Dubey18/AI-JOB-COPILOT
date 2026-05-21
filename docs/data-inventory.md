# Data Inventory

This document lists the main data categories handled by AI Job Copilot v2. It is an engineering inventory, not a legal privacy policy. Review with a qualified professional before using the app for public commercial users.

## Account Data

- Model: `User`
- Examples: full name, email, phone, avatar URL, role, email verification status, login metadata.
- Sensitive fields excluded from export/admin lists: `passwordHash`, `refreshTokenHash`, failed login counters, lock timestamps.
- Purpose: authentication, profile ownership, authorization, support.

## Career Profile Data

- Model: `Profile`
- Examples: headline, education, target roles, experience level, skills, salary expectations, links.
- Purpose: personalized job matching, resume suggestions, onboarding, analytics.

## Resume Data

- Models: `Resume`, `ResumeAnalysis`, `ResumeVersion`, `TailoredResume`
- Examples: uploaded file metadata, parsed resume text, parsed skills/projects, ATS score, section scores, tailored resume suggestions.
- Purpose: resume analysis, role-specific tailoring, job-match reasoning, interview preparation.
- Safety rule: do not invent experience or add skills the user does not claim.

## Job Search Data

- Models: `Job`, `JobMatch`, `ApplicationKit`, `Application`
- Examples: job records, match score, missing skills, application kit text, application status, notes, follow-up date.
- Purpose: job discovery, application tracking, follow-up reminders, analytics.
- Safety rule: the product supports manual user-reviewed applications only. It must not auto-apply or auto-message recruiters.

## Interview And Learning Data

- Models: `Interview`, `MockInterview`, `LearningPlan`
- Examples: scheduled rounds, topics, answers, AI feedback, skill gaps, seven-day and thirty-day plans.
- Purpose: preparation, readiness scoring, learning roadmap.

## Portfolio Data

- Model: `Portfolio`
- Examples: slug, hero, about text, skills, projects, resume URL, contact email, publish flag.
- Purpose: recruiter-friendly public profile or portfolio generation.
- Privacy note: public portfolio publishing should stay opt-in.

## AI Usage Data

- Model: `AIRequest`
- Examples: feature, provider, model, token estimates, status, error summary, latency, fallback flag, validation flag, safety flags, prompt character count.
- Purpose: usage limits, cost tracking, abuse prevention, debugging.
- Privacy note: the default implementation stores metadata and prompt length, not raw provider prompts or provider secrets.

## Notifications And Reminders

- Models: `Notification`, `NotificationPreference`
- Examples: in-app notification title/message, read state, channel, reminder preferences, quiet hours.
- Purpose: follow-up reminders, interview reminders, job-search nudges.
- Privacy note: email delivery is provider-ready and should keep sensitive resume details out of reminder subject lines.

## SaaS And Admin Data

- Models: `Subscription`, `UsageEvent`, `AuditLog`, `Feedback`
- Examples: plan id, usage events, audit action, risk level, feedback message.
- Purpose: feature limits, admin visibility, abuse detection, release improvement.
- Privacy note: audit logs may be retained in minimized form for security and incident review.

## Privacy Preferences

- Model: `PrivacyPreference`
- Fields: `allowAiTraining`, `shareProductAnalytics`, `emailDataExportUpdates`, `personalizationEnabled`, `deleteRequestedAt`.
- Defaults: AI training off, product analytics sharing off, export emails on, personalization on.

## Export Coverage

`GET /api/privacy/export` includes:

- Sanitized user account data.
- User-owned profile, resume, job-search, application, interview, portfolio, notification, usage, subscription, feedback, and privacy preference records.
- Minimized security audit records associated with the user.

The export intentionally excludes password hashes, refresh token hashes, provider credentials, `.env` values, and local generated files.

## Manual Review Points

- Confirm backup retention before production launch.
- Confirm external provider deletion procedures for AI, email, analytics, and monitoring providers.
- Add jurisdiction-specific legal text before commercial release.
- Confirm public portfolio privacy defaults before allowing public publication.
