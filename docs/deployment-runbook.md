# Deployment Runbook

## 1. Preflight

```bash
npm run check:git-safety
npm run build
npm test
```

## 2. Database

- Configure MongoDB Atlas.
- Add `MONGO_URI` to backend host.
- Do not seed production unless using intentional demo data.

## 3. Backend

- Deploy backend from `backend`.
- Build: `npm install && npm run build`
- Start: `npm start`
- Add backend env values.
- Verify `GET /health`.

## 4. Frontend

- Deploy frontend from `frontend`.
- Build: `npm run build`
- Add `NEXT_PUBLIC_API_URL`.
- Verify pages and API flows.

## 5. CORS

- Set backend `CLIENT_URL` to the deployed frontend origin.
- Redeploy backend after changing `CLIENT_URL`.
- Test login from deployed frontend.

## 6. Smoke Test

Run [Production Smoke Test](production-smoke-test.md).

## 7. Live URL Update

Use [Update Live URLs](update-live-urls.md). Do not invent URLs.
