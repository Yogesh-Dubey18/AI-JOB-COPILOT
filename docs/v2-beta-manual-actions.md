# v2 Beta Manual Actions

These actions require human/platform access and are not completed by local code changes.

## Deployment

- Create MongoDB Atlas cluster.
- Create production database user.
- Deploy backend to Render, Railway, or Fly.io.
- Deploy frontend to Vercel.
- Set real environment variables in hosting dashboards.
- Update CORS with the deployed frontend URL.
- Verify `/health`, `/ready`, and `/status`.
- Update docs with real live URLs only after verification.

## Providers

- Add Gemini or OpenAI key if real AI responses are required.
- Add SMTP, Resend, or SendGrid credentials for real email.
- Add Stripe keys only after product/legal review.
- Add monitoring provider DSN if Sentry or similar is chosen.
- Add object storage for production PDF exports.

## Extension

- Create PNG icons and store listing assets.
- Review privacy policy for browser extension behavior.
- Decide whether host permissions should be narrowed.
- Package and test in Chrome developer mode.
- Submit to Chrome Web Store only after privacy/legal review.

## QA

- Install Playwright if active E2E coverage is required.
- Run manual smoke testing on desktop and mobile.
- Test PWA install on Chrome Android and Edge desktop.
- Test Safari iOS fallback behavior.

## Commercial Review

- Review legal templates with a professional.
- Validate pricing and refund/cancellation language.
- Confirm data retention and deletion policy.
- Create support process before accepting real users.
