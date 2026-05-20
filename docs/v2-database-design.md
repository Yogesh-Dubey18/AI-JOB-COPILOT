# v2 Database Design

## Model Improvements

- Add audit logs for sensitive actions.
- Add subscription and usage event models.
- Add application timeline events.
- Add notification preferences.
- Add public profile/portfolio privacy controls.
- Add export history.

## Index Strategy

- `User.email` unique.
- User-owned collections indexed by `userId`.
- Jobs indexed by title, skills, location, posted date, and source.
- Applications indexed by `userId`, status, company, and next follow-up date.
- Notifications indexed by `userId`, `isRead`, and created date.
- Audit logs indexed by actor, action, and created date.

## Privacy

- Avoid storing unnecessary provider payloads.
- Do not log resumes or full private messages in analytics.
- Support export and delete account workflows.
