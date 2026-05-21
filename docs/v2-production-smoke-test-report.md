# v2 Production Smoke Test Report

This report is a template for the first real deployment smoke test. Live URLs have been provided, but end-to-end production smoke results still need to be recorded after manual verification.

## Environment

- Frontend URL: `https://ai-job-copilot-frontend.vercel.app/`
- Backend URL: `https://ai-job-copilot-backend-l6ut.onrender.com`
- Backend health URL: `https://ai-job-copilot-backend-l6ut.onrender.com/api/health`
- Database: MongoDB Atlas project pending
- AI provider: mock unless configured
- Email provider: mock unless configured
- Billing provider: mock unless configured

## Smoke Tests

| Area | Test | Status | Notes |
| --- | --- | --- | --- |
| Backend | Health endpoint returns safe JSON | Pending manual verification | Use provided backend health URL |
| Frontend | Landing page loads | Pending manual verification | Use provided frontend URL |
| Auth | Register and login demo user | Pending | Requires deployed backend and database |
| Resume | Upload TXT resume and analyze | Pending | Use mock AI unless provider keys are configured |
| Jobs | View jobs and match score | Pending | Seed or manual jobs required |
| Applications | Create and update application | Pending | Requires authenticated user |
| Interviews | Generate interview prep | Pending | Mock AI allowed |
| Analytics | Dashboard renders charts | Pending | Requires sample or user data |
| Privacy | Export account data | Pending | Requires authenticated user |
| Admin | Admin pages protected | Pending | Requires admin test account |

## Local Pre-Deployment Verification

- Root build: pass when `npm run build` succeeds.
- Root tests: pass when `npm test` succeeds.
- Security check: pass when `npm run check:security` succeeds.
- Git safety: pass when `npm run check:git-safety` succeeds.
- Docs links: pass when `npm run check:docs` succeeds.

## Final Result

Current result: URLs recorded, not fully live-verified in this report. Replace pending statuses with real results only after production smoke testing is completed.
