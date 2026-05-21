# Log Privacy Guide

AI Job Copilot handles resumes, job applications, AI prompts, recruiter messages, and job-search notes. Logs must stay useful without exposing private user data.

## Allowed In Logs

- Request ID.
- HTTP method and route path.
- Status code.
- Duration in milliseconds.
- User ID only when needed for debugging access-controlled behavior.
- Provider mode such as `mock`, `openai`, `gemini`, `stripe`, `smtp`, or `noop`.
- Aggregate counts and safe operational state.

## Avoid In Logs

- Passwords, JWTs, refresh tokens, reset tokens, cookies, API keys, DSNs, private keys, and connection strings.
- Raw resumes, parsed resume text, cover letters, recruiter messages, WhatsApp messages, and interview answers.
- Raw AI prompts or model outputs that may contain personal data.
- Full email addresses unless explicitly needed for transactional delivery debugging in a secure provider dashboard.
- Live URLs that have not been verified.

## Error Handling

- API error responses include `requestId` for support correlation.
- Production errors should use generic messages for unexpected failures.
- Development errors may include messages but should still avoid secrets.
- External monitoring context must be redacted before enabling a real provider.

## Audit Logs

Audit logs should record sensitive action metadata, not sensitive content. Keep:

- Actor ID and role.
- Category and action.
- Method and route.
- Status code.
- Risk level.
- Query key names, not query values.

## Review Cadence

- Review log fields before every release.
- Review new AI features for prompt/output logging risks.
- Review monitoring integration before enabling source maps or breadcrumbs.
