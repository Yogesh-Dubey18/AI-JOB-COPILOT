# v2 Testing Strategy

## Backend

- Auth API tests.
- Resume parser tests.
- AI fallback/provider tests.
- Application tracker tests.
- Notification/reminder tests.
- Billing usage limit tests.
- Admin protection tests.
- Privacy export/delete tests.

## Frontend

- Page render tests.
- Form validation tests.
- API loading/error state tests.
- Dashboard widget tests.
- Application tracker tests.
- Billing/settings tests.

## E2E

- Register/login smoke.
- Resume upload/analyze.
- Job detail/match.
- Application creation/status update.
- Interview prep.
- Admin protection.

## Release Rule

Do not tag releases when root build/test or git safety fails.
