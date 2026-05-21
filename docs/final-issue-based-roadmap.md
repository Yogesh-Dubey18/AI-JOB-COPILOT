# Final Issue-Based Roadmap

Future work should be tracked as issues, not more phases.

## Priority 0: Launch Blockers

- Deploy backend and verify `/health`.
- Deploy frontend and verify `NEXT_PUBLIC_API_URL`.
- Configure MongoDB Atlas.
- Configure CORS with real frontend URL.
- Run live smoke tests.
- Update live URL docs.

## Priority 1: Production Foundations

- Add real object storage for uploaded resumes and generated PDFs.
- Configure AI provider keys with usage limits and monitoring.
- Configure email provider for reminders.
- Add active Playwright E2E with CI browser install.
- Add backup and recovery process for MongoDB Atlas.

## Priority 2: Product Quality

- Improve resume parsing accuracy with real PDF/DOCX samples.
- Improve job matching using user feedback and outcome data.
- Improve application tracker reminders and timeline UX.
- Add more interview role templates.
- Improve mobile navigation and table ergonomics after user testing.

## Priority 3: Commercial Readiness

- Complete legal review.
- Configure Stripe, tax, cancellation, refund, and invoices.
- Build support and incident process.
- Add customer data processing docs.
- Validate pricing with real users.

## Issue Template

Use this shape for future work:

~~~md
## Problem

## Expected outcome

## Scope

## Out of scope

## Verification

## Risk
~~~

## Rule

Every issue should be small enough to build, test, review, and ship independently.
