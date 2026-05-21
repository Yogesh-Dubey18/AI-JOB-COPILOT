# Privacy System v2

Phase 38 adds a practical privacy foundation for AI Job Copilot without pretending full legal compliance. The goal is to make data handling visible, exportable, removable, and safer by default.

## Implemented Backend Endpoints

| Endpoint | Purpose | Auth |
| --- | --- | --- |
| `GET /api/privacy/export` | Returns a JSON export for the signed-in user. | Required |
| `GET /api/privacy/preferences` | Returns privacy preference defaults or saved settings. | Required |
| `PATCH /api/privacy/preferences` | Updates allowed boolean privacy preferences. | Required |
| `DELETE /api/privacy/account` | Deletes user-owned records after exact confirmation. | Required |

## Preferences

Defaults:

```json
{
  "allowAiTraining": false,
  "shareProductAnalytics": false,
  "emailDataExportUpdates": true,
  "personalizationEnabled": true
}
```

Important notes:

- AI training use is off by default.
- Product analytics sharing is off by default.
- Personalization is on because the app needs profile, resume, job, and application context to be useful.
- Email export updates only matter when a real email provider is configured.

## Export Behavior

The export service returns:

- Sanitized account data.
- User-owned records from profile, resume, jobs, applications, interviews, AI usage, billing, notifications, feedback, and privacy preferences.
- Associated audit logs with a retention notice.

Excluded:

- Password hashes.
- Refresh token hashes.
- Provider API keys.
- `.env` values.
- Local generated files.
- Raw AI provider prompts.

## Delete Behavior

Deletion requires:

```json
{
  "confirmation": "DELETE MY ACCOUNT"
}
```

The service deletes user-owned records from the configured repository and then deletes the user account. Audit logs can still be written by request middleware after the deletion request for security traceability; production policy should define whether these minimized records are retained or manually purged.

## Frontend

The new `/settings/privacy` page supports:

- Toggle privacy preferences.
- Generate an export preview.
- Guarded account deletion with exact confirmation text.

The public `/privacy` page now honestly describes the demo/privacy template status and points users toward export, deletion, retention, and audit-log behavior.

## Admin Safeguards

Admin user listings now omit password hashes, refresh token hashes, failed-login counters, and lock timestamps. Future admin pages should follow the same pattern: display operationally useful data, never secrets.

## Logging And Notification Privacy

- Structured logger redacts common sensitive keys and email addresses before writing.
- Notification email HTML escapes message content before handing it to the email provider.
- Reminder subjects should stay generic and avoid resume/application details.

## External Provider Manual Actions

Before production launch, define deletion and retention handling for:

- MongoDB Atlas backups.
- Resume/object storage.
- Email provider records.
- AI provider logs and retention settings.
- Monitoring events.
- Payment provider customer records.

## Test Coverage

Backend tests cover:

- Preference update.
- Data export without password hashes.
- Confirmed delete-account workflow.
- Admin user sanitization.

Frontend tests cover:

- Privacy settings page render.
- Public privacy page render.
