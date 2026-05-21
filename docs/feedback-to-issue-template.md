# Feedback To Issue Template

Use this template when converting in-app feedback into a GitHub issue. The app can generate a draft, but a maintainer must review it before creating the issue.

## Title

`[TYPE] Short user-impact summary`

## User Feedback

Paste the user's feedback in a concise form. Remove private information if it is not required for debugging.

## Context

- Page or workflow:
- Feedback type:
- Rating:
- Priority:
- User segment:
- Browser/device if known:

## Expected Behavior

What should the user have been able to do?

## Actual Behavior

What happened instead?

## Acceptance Criteria

- [ ] The issue is reproducible or clearly validated.
- [ ] The fix keeps user data private.
- [ ] The fix does not create auto-apply or auto-send behavior.
- [ ] Tests or manual verification steps are included.

## Labels

Recommended labels:

- `needs-triage`
- `bug`, `enhancement`, `ux`, `content`, `performance`, or `security`
- `feedback`

## Release Target

Set only after triage. Do not promise a date to users until the work is scheduled.
