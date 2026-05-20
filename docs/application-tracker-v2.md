# Application Tracker v2

Phase 28 upgrades the application tracker into a lightweight job-search CRM.

## What Changed

- Added application intelligence service for stage metadata, timeline events, default follow-up dates, follow-up status, and priority score.
- Added timeline storage for created, status changed, notes updated, and follow-up scheduled events.
- Added interview stage and round metadata derived from tracker status.
- Added aggregate insights endpoint for active applications, follow-ups due, interviews, offers, rejections, response rate, and priority next actions.
- Added follow-up scheduling endpoint.
- Improved frontend tracker with summary cards, priority follow-ups, and enriched Kanban cards.
- Added backend tests for application creation, status movement, timeline updates, and insights.

## Follow-Up Defaults

- Saved: 7 days.
- Applied: 5 days.
- Resume Viewed: 3 days.
- HR Call: 2 days.
- Assignment: 1 day.
- Interview stages: 2 days.
- Selected, Rejected, Withdrawn: closed/no default follow-up.

## Priority Score

Priority score increases when:

- The application is active.
- The candidate is in an interview stage.
- A follow-up is overdue or due soon.
- The application reaches offer stage.

This is a local heuristic to help the job seeker prioritize manual actions. It does not contact recruiters automatically.

## Future Work

- Add drag-and-drop Kanban status movement.
- Add calendar/email reminder providers behind mock-safe abstractions.
- Add per-application contact history.
- Add weekly application CRM analytics.
- Add follow-up template suggestions based on status and days since last activity.

