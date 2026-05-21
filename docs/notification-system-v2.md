# Notification System v2

Phase 29 upgrades notifications into a reminder-ready foundation.

## What Changed

- Added notification preference persistence.
- Added notification metadata for channel, priority, scheduled time, delivery status, dedupe key, metadata, and read timestamp.
- Added application reminder scanner that finds due or overdue application follow-ups and creates deduped in-app notifications.
- Added mock-safe email provider architecture for mock, SMTP, Resend-ready, and SendGrid-ready modes.
- Added mock-safe calendar provider architecture for mock and Google-ready modes.
- Added notification preference routes and application reminder scan route.
- Integrated application tracker stage/follow-up events with notifications.
- Improved frontend notification center with unread stats, reminder scan action, provider preference toggles, and priority badges.

## Reminder Behavior

- Application reminders are generated only for active applications.
- Selected, rejected, and withdrawn applications are skipped.
- Reminder notifications use a dedupe key based on application ID and follow-up date.
- Email and calendar delivery remain disabled unless preferences and providers are configured.

## Provider Safety

- Mock mode never sends email or creates calendar events.
- SMTP can send only when SMTP env values are configured.
- Resend and SendGrid are provider-ready placeholders and do not perform network sends in this foundation.
- Google Calendar is provider-ready and does not create events until OAuth implementation is added.

## Future Work

- Add background scheduled reminder jobs.
- Add real Resend/SendGrid provider adapters after credential setup.
- Add Google Calendar OAuth and token storage.
- Add notification delivery logs.
- Add quiet-hours enforcement.

