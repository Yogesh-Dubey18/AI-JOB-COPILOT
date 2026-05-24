# Beta Feedback Triage Board

**Sprint:** Beta UX Feedback Fix Sprint (2026-05-24)  
**Source:** Private beta tester audit

---

## Backlog → Done

| ID | Priority | Title | Assigned | Status |
|----|----------|-------|----------|--------|
| BF-01 | 🔴 HIGH | Login: "Forgot password?" link missing | Auth | ✅ Done |
| BF-02 | 🔴 HIGH | Landing: duplicate feature card descriptions | Landing | ✅ Done |
| BF-03 | 🔴 HIGH | Blog: misleading "Read guide" links | Blog | ✅ Done |
| BF-04 | 🔴 HIGH | Register: Full Name field confirmation | Auth | ✅ Done (already existed) |
| BF-05 | 🟡 MED | Landing: How it works too barebones | Landing | ✅ Done |
| BF-06 | 🟡 MED | Pricing: "Review plan" CTA ambiguous | Pricing | ✅ Done |
| BF-07 | 🟡 MED | Hero CTA misleads to /register | Landing | ✅ Done |
| BF-08 | 🟡 MED | Feedback page generic title | Feedback | ✅ Done |
| BF-09 | 🟡 MED | No trust signals on landing | Landing | ✅ Done (honest badge) |
| BF-10 | 🟢 LOW | Features: "Try it" needs login-required label | Features | ✅ Done |
| BF-11 | 🟢 LOW | Google OAuth placeholder missing | Auth | ✅ Done (disabled) |
| BF-12 | 🟢 LOW | Blog: no dates or attribution | Blog | ✅ Done |

---

## Backlog → Deferred

| ID | Title | Reason | Ticket |
|----|-------|--------|--------|
| BD-01 | Full blog articles (long-form content) | Needs content strategy | Future |
| BD-02 | Google OAuth (real) | Needs Google Cloud credentials | Provider readiness |
| BD-03 | Stripe billing activation | Needs Stripe + tax + legal + refund policy | Provider readiness |
| BD-04 | Real beta tester count / social proof | Must be real numbers | Post-beta |
| BD-05 | Open /demo route (no login) | Demo mode exists via cold-start fallback | Future |

---

## Open Beta Gate

Open beta is now **unlocked** (all verification checks passed):

- [x] Deploy v2.0.2 verified live on Vercel
- [x] Manual retest: /login has Forgot password link
- [x] Manual retest: /register has Full Name field visible
- [x] Manual retest: /features shows "login required"
- [x] Manual retest: /pricing shows "Get notified" CTA
- [x] Manual retest: /feedback browser tab shows "Feedback | AI Job Copilot"
- [x] Manual retest: /blog links have correct labels
- [x] Manual retest: landing trust badge visible
- [x] Manual retest: no console errors, no secret leaks

---

## Open Beta Backlog & Hardening Roadmap

The following tasks are prioritized for the next sprint based on initial open beta tester feedback:

| Ticket ID | Priority | Feature / Feature Area | Assigned | Status |
|---|---|---|---|---|
| **OB-P0-01** | 🔴 P0 | Upload hardening with S3/R2 and magic number validation | Security / Backend | 🔄 Triaged / Accepted |
| **OB-P1-02** | 🟡 P1 | Google OAuth activation (configuring real credentials) | Auth / Frontend | ⏳ Triaged |
| **OB-P1-03** | 🟡 P1 | Playwright E2E pipeline browser tests | Testing / CI-CD | ⏳ Triaged |
| **OB-P2-04** | 🔵 P2 | Continue collecting real user feedback | Analytics / Product | 🔄 Active |
