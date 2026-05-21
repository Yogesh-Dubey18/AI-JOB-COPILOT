# Feedback To Release Loop

## Loop

1. User submits feedback in the app.
2. Admin reviews feedback in the dashboard.
3. Admin generates or writes an issue draft.
4. Maintainer converts the draft into a GitHub issue after privacy review.
5. Issue is prioritized into a sprint.
6. Work is implemented and verified.
7. Changelog and release notes are updated.
8. Feedback record is marked resolved or closed.

## Status Meaning

- `open`: received and not reviewed.
- `in_review`: being triaged.
- `planned`: accepted into backlog or sprint planning.
- `in_progress`: implementation is active.
- `resolved`: fix or response completed.
- `closed`: no action planned or duplicate handled.

## Release Discipline

- Do not ship unverified fixes.
- Do not claim real user impact without deployment evidence.
- Keep release notes concise and traceable to issue IDs when available.
