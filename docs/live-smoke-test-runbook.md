# Live Smoke Test Runbook

This runbook guides operators through performing manual smoke tests on the live deployment of **AI Job Copilot** to ensure that production releases do not introduce runtime errors or security flaws.

---

## 📋 Smoke Test Checklist

### 1. Warm-Up Phase
- [ ] Ping the backend health endpoint: `https://ai-job-copilot-backend-l6ut.onrender.com/health`.
- [ ] Verify that it returns `{"success":true}`. If it times out, wait 60 seconds (for Render cold start) and retry.

### 2. Public Pages Verification
Visit the following routes on the live frontend (`https://ai-job-copilot-frontend.vercel.app`):
- [ ] `/` (Landing page) - Ensure hero images, FAQ, and action buttons render.
- [ ] `/features` - Ensure all 12 feature items list Try it buttons.
- [ ] `/pricing` - Verify plan cards and INR billing limits show.
- [ ] `/about` - Verify phase timeline and company value cards.
- [ ] `/contact` - Verify contact text handles.
- [ ] `/blog` - Verify 10 SEO guide cards render.
- [ ] `/resources` - Verify featured templates and copy-paste utilities work.
- [ ] `/recruiters` - Verify the roadmap lists and that the submission button is disabled with "not live yet".

### 3. Route Access Controls
- [ ] Open a browser in Incognito mode.
- [ ] Navigate to `/dashboard` directly.
- [ ] Verify that the page redirects to `/login` with `?next=/dashboard` in the URL.
- [ ] Navigate to other protected routes (`/jobs`, `/guided-workflow`, `/contacts`, `/answer-vault`) and confirm redirects work for all of them.

### 4. Demo Authentication Fallback (If Backend is Offline)
- [ ] On `/login`, trigger a network error (or check when backend is unreachable).
- [ ] Confirm the yellow notice box appears: "Demo-safe notice: the backend auth service is currently unavailable..."
- [ ] Click the **"Continue in Demo Mode (Local Mock Session)"** button.
- [ ] Confirm you are redirected to `/dashboard` with mock metrics populated.

### 5. Console & Network Inspect
- [ ] Open Chrome DevTools (`F12`).
- [ ] Navigate through several pages.
- [ ] Verify that no API keys, client secrets, or private tokens are logged in the Console.
- [ ] Check the Network tab to ensure all API requests use `https://` (no insecure `http` links).

---

## 🛠️ Recovery Procedures

If any test in the checklist fails, follow the escalation procedure below:

### 1. Backend 502/504 Bad Gateway / Cold Start
- Render free tier instances spin down after 15 minutes of inactivity.
- **Action:** Wait 1–2 minutes to allow Render to finish boot cycle, then refresh `/health`.
- **Action:** If Render remains unresponsive, check the Render Dashboard logs for crash loops.

### 2. Mixed Content Warnings
- Occurs if `NEXT_PUBLIC_API_URL` uses `http://` instead of `https://`.
- **Action:** Confirm that frontend environment variables in Vercel settings explicitly define `NEXT_PUBLIC_API_URL=https://ai-job-copilot-backend-l6ut.onrender.com/api`.

### 3. Rollback
- If a production build is broken, roll back immediately:
  - **Vercel:** Redeploy the last stable deployment from the Vercel Dashboard.
  - **Render:** Roll back the backend service to the last stable commit image.
