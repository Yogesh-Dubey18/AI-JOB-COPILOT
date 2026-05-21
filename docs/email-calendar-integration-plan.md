# Email Calendar Integration Plan

This plan documents how to move from mock/provider-ready reminders to real provider integrations.

## Email Providers

### Mock

- Default local mode.
- Does not send messages.
- Safe for demos and tests.

### SMTP

- Required env values: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.
- Good for transactional testing with a provider account.
- Must avoid logging credentials.

### Resend

- Required env value: `RESEND_API_KEY`.
- Add provider adapter only after account setup and sending-domain verification.
- Store templates in source, secrets in provider dashboard.

### SendGrid

- Required env value: `SENDGRID_API_KEY`.
- Add provider adapter only after account setup and sender verification.
- Use sandbox/test mode before production sending.

## Calendar Providers

### Mock

- Default local mode.
- Does not create calendar events.

### Google Calendar

- Required env values: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`.
- Requires OAuth consent screen, redirect URI, token storage, revocation, and user consent.
- Do not add events automatically without user review.

## Rollout Steps

1. Keep mock mode as default.
2. Add provider credentials in hosting dashboards only.
3. Verify provider sandbox/test mode.
4. Add delivery logs.
5. Add user opt-in preferences.
6. Add unsubscribe/disable controls.
7. Monitor bounce/error rates.

## Privacy Rules

- Do not send resumes or sensitive notes by default.
- Keep subject lines neutral.
- Allow users to disable reminders.
- Do not create calendar events without user opt-in.

