# UX Review Checklist

Use this checklist for product review after each workflow change.

## Core Flow

- The screen has one obvious primary task.
- The user can recover from empty data, failed requests, and invalid form input.
- AI output is clearly review-based and does not imply auto-apply or auto-send behavior.
- Workflow language stays honest for freshers and does not invent experience.

## Dashboard

- Profile, resume, job, application, interview, and skill signals are scannable.
- Recommended jobs show a useful state while loading and a useful next action when empty.
- CTAs point to the next step, not marketing copy.

## Resume Workflow

- File upload explains accepted formats and size limits.
- The parsed preview is visible only after upload success.
- Upload failure text is actionable.
- Resume analysis and tailoring preserve the no-fake-experience rule.

## Jobs Workflow

- Search and filters are labelled and usable on mobile.
- Empty results suggest a practical adjustment.
- Trust and scam risk are visible before official apply links.
- Official apply links stay user-reviewed and manual.

## Application Tracker

- The pipeline remains usable when empty.
- Manual application creation has required company and role fields.
- Follow-up and interview cues are readable without opening every application.
- Rejected/selected/withdrawn states are preserved as terminal outcomes.

## Admin And SaaS

- Admin pages avoid exposing secrets or real provider tokens.
- Billing copy labels mock/demo provider behavior honestly.
- Usage and AI credit data are understandable without overclaiming commercial readiness.

## Release Review

- Run build, test, docs check, security check, and git safety check.
- Review responsive layouts manually or with Playwright when available.
- Update `PHASE_PROGRESS.md` with failures and fixes, not only final success.
