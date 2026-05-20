# Update Live URLs

Only update live URLs after they are provided and verified.

## Required Values

- `FRONTEND_LIVE_URL`
- `BACKEND_LIVE_URL`
- `BACKEND_HEALTH_URL`

## Files To Update

- `README.md`
- `docs/deployment-guide.md`
- `docs/production-smoke-test.md`
- `docs/public-demo-notes.md` after it exists

## Rules

- Do not add fake URLs.
- Do not add unverified URLs.
- Keep placeholders if live values are missing.
- Verify backend health before updating frontend API docs.
- Verify frontend loads before calling the demo public.

## Verification

```bash
curl <BACKEND_HEALTH_URL>
```

Then open `<FRONTEND_LIVE_URL>` and test login, resume upload, jobs, and application tracker.
