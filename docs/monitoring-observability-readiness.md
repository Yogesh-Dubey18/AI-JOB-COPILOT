# Monitoring and Observability Readiness

**Version:** v2 beta  
**Updated:** May 2026

---

## Current Monitoring Status

| Area | Status | Notes |
|------|--------|-------|
| Backend health endpoint | ✅ Live | `GET /health` returns safe service status |
| Frontend error boundary | ✅ Live | Shared ErrorState component with retry |
| API error response consistency | ✅ Live | Standard `{ success, data, message }` envelope |
| Request ID in responses | ⚠️ Partial | x-request-id in some responses |
| Sentry error tracking | ⚠️ Provider-ready | DSN not configured |
| Uptime monitoring | ⚠️ Provider-ready | URLs documented below |
| Structured backend logging | ⚠️ Partial | Console logs; no JSON/structured format |
| Performance monitoring | ❌ Not set up | Recommended before public launch |
| Alert channels | ❌ Not set up | Depends on uptime monitoring provider |

---

## Frontend Monitoring Readiness

### Error Boundary
- `<ErrorState>` component with `role="alert"` — announces errors to screen readers
- Error state includes description and retry button where applicable
- Used on: jobs, contacts, applications, interviews, skill-gap, career-vault, answer-vault, company-research, analytics, notification preferences pages

### Sentry — Provider-ready

Add the following to `frontend/.env.local` to activate Sentry on the frontend:

```
NEXT_PUBLIC_SENTRY_DSN=https://...@o....ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=v2.0.0
```

Required packages (not yet installed):
```bash
npm install @sentry/nextjs
```

Sentry `withSentryConfig` wrapper in `next.config.js` — add when DSN is configured.

### Performance
- Blog and Resources pages are fully static (no client JS, no API calls)
- React Query provides built-in caching — no unnecessary re-fetches
- No heavy dependencies added in v2 beta

---

## Backend Monitoring Readiness

### Health Endpoint
Live at: `GET /health`  
Returns: `{ status: "ok", db: "connected", version: "..." }`  
**Never exposes secrets, tokens, or private data.**

### Request/Error Logging
- Backend uses `console.error` for unhandled errors
- Failed auth attempts are logged (no sensitive data — only timestamps and IP)
- AI provider failures are logged (no prompt content)

### Sentry — Provider-ready

Add to `backend/.env` to activate Sentry on the backend:

```
SENTRY_DSN=https://...@o....ingest.sentry.io/...
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=v2.0.0
```

Required packages:
```bash
npm install @sentry/node
```

Wrap Express app with Sentry middleware after installing.

---

## Provider Health Status

| Provider | Monitored via | Current Status |
|----------|---------------|---------------|
| Backend API | /health endpoint | ✅ Live |
| MongoDB | /health response includes db status | ✅ Live |
| AI provider (OpenAI/Gemini) | Try/catch logs to console | ⚠️ Not monitored |
| Email provider | Not monitored | ⚠️ Not configured |
| Calendar provider | Not monitored | ⚠️ Not configured |
| Stripe billing | Not monitored | ⚠️ Not configured |
| S3 storage | Not monitored | ⚠️ Not configured |
| Sentry | Not configured | ❌ Provider-ready |
| Uptime monitoring | Not configured | ❌ Provider-ready |

---

## Uptime Monitoring Setup

### Recommended URLs to Monitor

| URL | Purpose |
|-----|---------|
| `https://ai-job-copilot-frontend.vercel.app` | Frontend landing page |
| `https://ai-job-copilot-backend-l6ut.onrender.com/health` | Backend health check |

### Recommended Tools
- **UptimeRobot** (free tier) — 5-minute interval, email/Slack alerts
- **Better Stack** — 1-minute interval, on-call alerting
- **Pingdom** — enterprise uptime + performance monitoring

### Setup Steps (UptimeRobot example)
1. Create account at uptimerobot.com
2. Add monitor: `HTTP(s)` → URL: `https://ai-job-copilot-backend-l6ut.onrender.com/health`
3. Set interval: 5 minutes
4. Add alert contact (email or Slack webhook)
5. Repeat for frontend URL
6. Verify monitor is green before announcing launch

---

## Sentry Setup Steps

### Frontend (Next.js)
1. Create project at sentry.io
2. Install: `npm install @sentry/nextjs`
3. Run: `npx @sentry/wizard@latest -i nextjs`
4. Add DSN to Vercel environment variables
5. Deploy and trigger a test error to verify

### Backend (Node.js / Express)
1. Create project at sentry.io (or use same org as frontend)
2. Install: `npm install @sentry/node`
3. Initialize in `src/app.ts` before routes
4. Add DSN to Render environment variables
5. Deploy and trigger a test error

---

## Alerting Plan

| Event | Recommended Alert |
|-------|------------------|
| Backend health check fails | Immediate — page on-call |
| Frontend down | Immediate — page on-call |
| Sentry error spike | Email alert within 5 min |
| AI provider rate limit | Dashboard notification |
| Database connection failure | Immediate — page on-call |
| Slow response (>3s p95) | Daily digest |

---

## Manual Smoke-Test Checklist

Run before every production deploy:
- [ ] `GET https://ai-job-copilot-backend-l6ut.onrender.com/health` returns `{ status: "ok" }`
- [ ] Frontend landing page loads at `https://ai-job-copilot-frontend.vercel.app`
- [ ] Login flow works end-to-end
- [ ] Resume upload works
- [ ] Jobs page loads
- [ ] Application tracker loads
- [ ] Dashboard loads
- [ ] Settings > Integrations shows correct provider status
- [ ] No secrets visible in network responses or page source
- [ ] Console has no unhandled JS errors on main pages

---

## Known Limitations

- No Sentry DSN configured — errors are only logged to console
- No uptime monitoring active — requires manual setup
- No performance monitoring baseline established
- No alert channels configured
- Backend logs are not structured (no JSON format, no correlation IDs)
- AI provider failure is only visible in backend console logs

---

## Future Improvements

1. Add Sentry to frontend and backend
2. Add UptimeRobot or Better Stack for uptime monitoring
3. Add structured JSON logging with correlation IDs to backend
4. Add `GET /admin/status` endpoint for internal provider health summary
5. Add AI provider health check to `/health` response
6. Add performance baseline with Lighthouse CI
7. Add error rate alerting thresholds
