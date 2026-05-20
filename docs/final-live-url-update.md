# Final Live URL Update

Only update docs with real URLs after all values are provided and verified:

- `FRONTEND_LIVE_URL`
- `BACKEND_LIVE_URL`
- `BACKEND_HEALTH_URL`

## Update Locations

- `README.md`
- `docs/final-deployment-values.md`
- `docs/live-deployment-verification-report.md`
- `docs/final-production-smoke-report.md`
- Any demo docs that reference deployment status.

## Verification

1. Open frontend URL.
2. Check backend health URL.
3. Confirm frontend API requests use backend URL.
4. Confirm CORS allows frontend origin.
5. Run production smoke test.

## Rule

Do not invent live URLs. Keep placeholders until real deployment is available.
