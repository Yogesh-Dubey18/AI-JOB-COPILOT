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
- PDF export is a foundation placeholder and does not generate production PDFs yet.

## Deployment

- No live URLs are currently verified.
- MongoDB Atlas must be configured for persistent deployed data.
- CORS must be updated with the real frontend origin.

## Product Scope

- The app does not auto-apply.
- The app does not auto-send recruiter messages.
- The app does not guarantee interviews, offers, or selection.
- Legal pages are templates requiring professional review.
