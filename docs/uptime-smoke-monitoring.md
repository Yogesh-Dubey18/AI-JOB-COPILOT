# Uptime Smoke Monitoring

## Endpoints To Monitor

- Frontend home page.
- Frontend login page.
- Backend health endpoint.
- Backend auth `me` route behavior for unauthenticated request.

## Manual Smoke Test

1. Open frontend URL.
2. Confirm landing page renders.
3. Open login page.
4. Confirm backend health returns safe status.
5. Register/login with test credentials in a non-production test environment.
6. Upload a small test resume.
7. Run one AI fallback feature.

## Alert Conditions

- Frontend returns non-200.
- Backend health is down.
- Login page cannot reach API.
- Database unavailable.
- Response time stays high for repeated checks.

## Notes

Do not publish real test credentials in docs. Use platform secrets or temporary manual accounts.
