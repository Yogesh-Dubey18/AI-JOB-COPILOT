# Notification Preferences

AI Job Copilot supports granular notification preferences per user. This document describes the implemented features, provider-ready features, and backend API.

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/preferences` | Fetch current user's notification preferences |
| PATCH | `/api/notifications/preferences` | Update notification preferences |
| GET | `/api/notifications/` | List all dashboard notifications |
| PATCH | `/api/notifications/read-all` | Mark all notifications read |
| PATCH | `/api/notifications/:id/read` | Mark specific notification read |
| POST | `/api/notifications/reminders/applications` | Trigger application reminder scan |

## Preference Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| jobMatchAlertsEnabled | boolean | true | Enable new job match alerts |
| minimumMatchScore | number | 60 | Minimum match % to trigger alert |
| jobAlertFrequency | string | daily | instant / daily / weekly / off |
| followUpRemindersEnabled | boolean | true | Enable follow-up reminders |
| defaultFollowUpDelayDays | number | 5 | Days after applying to send reminder |
| interviewRemindersEnabled | boolean | true | Enable interview reminders |
| reminderTimings | string[] | ["24h before"] | When to send interview reminder |
| staleApplicationDays | number | 14 | Days before application is flagged stale |
| staleApplicationRemindersEnabled | boolean | true | Enable stale application reminders |
| dashboardNotificationsEnabled | boolean | true | Show in-app dashboard notifications |
| emailNotificationsEnabled | boolean | false | Email channel (provider-ready) |
| calendarRemindersEnabled | boolean | false | Calendar channel (provider-ready) |

## Channel Status

| Channel | Status | Required Env Vars |
|---------|--------|------------------|
| Dashboard notifications | ✅ Live | None |
| Email notifications | ⚠️ Provider-ready | `SENDGRID_API_KEY` or `SMTP_*` in backend .env |
| Calendar reminders | ⚠️ Provider-ready | `GOOGLE_CALENDAR_*` env vars + OAuth consent |
| Browser push | ⚠️ Provider-ready | Web push credentials (VAPID keys) |

## Frontend Route

`/settings/notifications` — accessible from the Settings page.

## Important Safety Notes

- Email and calendar providers must be configured before those channels work.
- Storing a preference for email/calendar does not activate sending.
- No emails or calendar events are created in demo/fallback mode.
- No provider credentials are stored in the frontend or exposed to users.
