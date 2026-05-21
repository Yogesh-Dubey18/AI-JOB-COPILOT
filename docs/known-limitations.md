# Known Limitations

## Provider Integrations

- AI uses mock fallback unless Gemini or OpenAI keys are configured.
- Email sending is mock unless SMTP credentials are configured.
- Billing is mock/Stripe-ready and does not process payments.
- Cloudinary is optional; uploads use local fallback when missing.
- Redis/BullMQ queues fall back safely when Redis is missing.

## Resume Parsing

- TXT resumes parse best locally.
- PDF and DOCX use safe fallback extraction until dedicated parser packages are added.
- Resume Intelligence v2 adds deterministic ATS heuristics and role keyword coverage, but it is not a guarantee of recruiter screening results.
- PDF export generates local PDFs with a basic renderer, but branded templates, object storage, signed URLs, and retention jobs are still future production work.

## Deployment

- No live URLs are currently verified.
- v2.0.0 is a stable source and architecture release, not a verified live production deployment.
- MongoDB Atlas must be configured for persistent deployed data.
- CORS must be updated with the real frontend origin.
- PWA behavior is a navigation fallback only; private app data is not cached offline.

## Product Scope

- The app does not auto-apply.
- The app does not auto-send recruiter messages.
- The app does not guarantee interviews, offers, or selection.
- Legal pages are templates requiring professional review.
- The Chrome extension is an unpacked manual-capture foundation, not a published browser-store package.
- Playwright E2E is skip-safe unless Playwright is installed.
