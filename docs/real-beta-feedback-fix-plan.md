# Real Beta Feedback Fix Plan

**Sprint date:** 2026-05-24  
**Based on:** Internal beta tester audit (AI-assisted walkthrough, live site)  
**Commit baseline:** 23516ec  

---

## Feedback Source

Structured tester walkthrough of all live public routes on https://ai-job-copilot-frontend.vercel.app.
Tested: landing, login, register, blog, features, pricing, feedback.
Not tested with real credentials (backend cold-start).

---

## Fixes Selected and Completed

| # | Fix | File(s) Changed | Status |
|---|---|---|---|
| 1 | Login: Add "Forgot password?" link | `auth-form.tsx` | ✅ Done |
| 2 | Register: Full Name field confirmation | `auth-form.tsx` (already existed) | ✅ Confirmed |
| 3 | Landing: Unique feature card descriptions | `app/page.tsx` | ✅ Done |
| 4 | Landing: How it works — descriptions + icons | `app/page.tsx` | ✅ Done |
| 5 | Hero CTA copy alignment | `app/page.tsx` | ✅ Done |
| 6 | Blog: Fix misleading links, add labels, dates, author | `app/blog/page.tsx` | ✅ Done |
| 7 | Pricing: Rename "Review plan" + add billing FAQ | `app/pricing/page.tsx` | ✅ Done |
| 8 | Feedback: Add page-specific metadata | `app/feedback/page.tsx` | ✅ Done |
| 9 | Features: "Try it — login required" label | `app/features/page.tsx` | ✅ Done |
| 10 | Google OAuth: disabled/provider-ready placeholder | `auth-form.tsx` | ✅ Done |
| 11 | Trust signals: honest beta banner, no fake metrics | `app/page.tsx` | ✅ Done |

---

## Deferred Items

- Real blog article pages (full content): Deferred — requires content strategy decision.
- Google OAuth real flow: Deferred — requires Google Cloud Console credentials.
- Stripe billing activation: Deferred — requires Stripe account, tax policy, refund policy.
- Demo mode flow without login: Existing demo mode button retained in cold-start UX.
- Social proof (real tester count): Deferred — cannot add until real count is confirmed.

---

## Manual Retest Checklist

### Routes needing retest after this deploy:

| Route | What to check |
|---|---|
| `/login` | "Forgot password?" link visible. Google OAuth button disabled. |
| `/register` | Full Name field visible. Google OAuth button disabled. |
| `/` (landing) | How it works has descriptions + icons. Feature comparison cards have unique text. CTA says "Start free — upload resume and see your ATS score". Beta trust banner visible. |
| `/blog` | Link labels honest (View resource / Open tool — login required). Salary guide links to /resources not /company-research. Beta guide labels visible. Author visible. |
| `/features` | "Try it — login required" on all cards. |
| `/pricing` | "Get notified when X launches" button. Billing FAQ note visible. |
| `/feedback` | Browser tab shows "Feedback | AI Job Copilot". |
| `/auth/forgot-password` | Page loads (route already existed). |

### No regressions to check:
- Auth middleware: /dashboard, /jobs, /settings/integrations must still redirect to /login ✅
- Cold-start UX in auth form: must remain functional ✅
- Demo mode: still accessible from cold-start notice ✅
- No secrets committed ✅
- No .env files committed ✅

---

## Beta Status

| Status | Verdict |
|---|---|
| Private beta | ✅ Ready after deployment verification |
| Open beta | ⏳ Wait until routes above are manually retested after deploy |
