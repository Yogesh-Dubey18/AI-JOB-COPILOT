# Error Tracking Plan

## Error Categories

- Frontend runtime errors.
- API validation errors.
- Auth/session errors.
- Database connection errors.
- AI provider errors.
- File upload/parse errors.
- Email/reminder errors.

## Minimum Error Record

- Timestamp.
- Request ID if available.
- User ID or anonymous marker.
- Endpoint or frontend route.
- Error name.
- Safe message.
- Stack trace in development only.
- Provider name when relevant.

## Privacy Rules

- Do not log passwords, tokens, refresh tokens, API keys, resumes, or full AI prompts.
- Avoid logging full user messages unless explicit debugging mode is enabled.
- Redact emails and phone numbers in shared reports.

## Triage

- Reproduce locally.
- Check recent commits.
- Identify affected users/features.
- Fix or rollback.
- Add regression test where possible.
