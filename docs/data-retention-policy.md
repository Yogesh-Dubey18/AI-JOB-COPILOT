# Data Retention Policy

This is a technical retention template for AI Job Copilot. It is not legal advice and must be reviewed before production commercialization.

## Default Retention Position

- Keep only the data needed to run the job-search assistant.
- Do not store real provider secrets in the database.
- Do not store raw AI provider prompts in the default AI usage log.
- Keep mock/demo data local unless a real MongoDB Atlas environment is configured.

## Suggested Retention Windows

| Data category | Suggested retention | Notes |
| --- | --- | --- |
| Account and profile data | Until account deletion | Required for user-owned product experience. |
| Resume uploads and parsed data | Until user deletes resume or account | Treat as sensitive personal career data. |
| Resume analyses and tailored versions | Until user deletes resume/account | Useful for history and comparison. |
| Jobs and job sources | Until expiry or periodic cleanup | Remove expired jobs; avoid illegal scraping. |
| Applications and interview records | Until user deletes account | User-owned job-search CRM data. |
| Notifications | 90 to 180 days after read | Keep short unless needed for reminders. |
| AI usage metadata | 12 to 24 months | Needed for cost, abuse, and debugging. No raw prompts by default. |
| Audit logs | 12 to 24 months | Security records may be retained in minimized form. |
| Feedback | Until resolved plus 12 months | Remove user identifiers where practical. |
| Backups | Provider-specific | Must be documented per hosting provider. |

## Account Deletion

`DELETE /api/privacy/account` removes user-owned records from the configured application store after the user submits the exact confirmation phrase:

```text
DELETE MY ACCOUNT
```

The current implementation deletes records from local memory mode and MongoDB-backed repositories. It does not delete deployment backups or external provider records automatically. Production runbooks must cover:

- MongoDB Atlas backup retention.
- Email provider suppression or deletion.
- AI provider retention settings.
- Monitoring provider issue/event retention.
- Object storage or Cloudinary resume file deletion where enabled.

## Data Export

`GET /api/privacy/export` returns a JSON package for the signed-in user. Exports should be treated as sensitive and should not be logged, cached publicly, or emailed as an attachment without extra safeguards.

## Logging Privacy

Backend structured logging redacts common sensitive keys and email addresses. Engineers should still avoid passing request bodies, resumes, raw prompts, or exported data into log metadata.

## AI Privacy

The AI request tracker stores feature, provider, model, token estimates, status, validation, safety flags, and prompt character count. It does not store raw prompts by default. If future debugging requires raw prompt storage, it must be opt-in, time-limited, redacted, and documented.

## Review Cadence

- Review retention settings before every public launch.
- Review data inventory after every new model or provider integration.
- Test export/delete flows before major releases.
- Revisit legal copy before enabling paid subscriptions.
