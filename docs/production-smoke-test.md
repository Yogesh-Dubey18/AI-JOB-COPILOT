# Production Smoke Test

Run after both frontend and backend are deployed.

## Health

```bash
curl https://your-backend-host.example.com/health
```

Expected:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "AI Job Copilot API"
  }
}
```

## Browser Flow

- Open frontend URL.
- Register a new demo user.
- Log in.
- Complete onboarding.
- Upload a TXT resume.
- Run resume analyzer.
- View jobs.
- Match a job.
- Tailor resume.
- Generate application kit.
- Create application.
- Update application status.
- Generate interview prep.
- Open analytics.
- Open settings and billing.

## Admin Flow

- Log in as an admin account.
- Open admin dashboard.
- Review users, jobs, AI usage, and feedback.

## Fail Conditions

- Backend health fails.
- Browser CORS error appears.
- Auth cookie/session fails.
- MongoDB data disappears unexpectedly.
- Any real secret appears in logs or UI.
