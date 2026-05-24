# Private Beta Feedback Intake Log

**Log created:** 2026-05-24  
**Platform:** AI Job Copilot — https://ai-job-copilot-frontend.vercel.app  
**Beta type:** Private beta (closed)  

---

## Session 1 — 2026-05-24

**Source:** AI-assisted structured tester audit (full walkthrough, live site)  
**Tester:** Internal (AI tester walkthrough)  
**Verdict:** Solid beta foundation. Ready for closed beta. Open beta should wait for UX fixes.

### Bugs and UX Issues Reported

| ID | Priority | Page | Issue | Status |
|----|----------|------|-------|--------|
| BF-01 | 🔴 HIGH | /login | "Forgot password?" link missing | ✅ Fixed |
| BF-02 | 🔴 HIGH | / (landing) | Feature comparison cards have duplicate description text | ✅ Fixed |
| BF-03 | 🔴 HIGH | /blog | "Read guide" links go to auth-gated pages without warning | ✅ Fixed |
| BF-04 | 🔴 HIGH | /register | Full Name field visibility concern (SSR-only audit) | ✅ Confirmed present |
| BF-05 | 🟡 MED | / (landing) | "How it works" steps have no descriptions | ✅ Fixed |
| BF-06 | 🟡 MED | /pricing | "Review plan" CTA label is ambiguous | ✅ Fixed |
| BF-07 | 🟡 MED | / (landing) | Hero CTA says "Upload resume" but goes to /register | ✅ Fixed |
| BF-08 | 🟡 MED | /feedback | Page title is generic ("AI Job Copilot") | ✅ Fixed |
| BF-09 | 🟡 MED | / (landing) | No trust signals / social proof | ✅ Fixed (honest badge) |
| BF-10 | 🟢 LOW | /features | "Try it" buttons don't indicate login is required | ✅ Fixed |
| BF-11 | 🟢 LOW | /login, /register | No Google OAuth button visible | ✅ Fixed (disabled placeholder) |
| BF-12 | 🟢 LOW | /blog | No publication dates or author attribution | ✅ Fixed |

### Feedback Not Acted On (Deferred)

| ID | Issue | Reason |
|----|-------|--------|
| BD-01 | Full blog article pages (long-form content) | Content strategy required |
| BD-02 | Activate Google OAuth | Needs Google Cloud credentials |
| BD-03 | Activate Stripe billing | Needs Stripe + legal + tax setup |
| BD-04 | Real beta tester count / social proof | Cannot add fake numbers |
| BD-05 | Demo route without login | Demo mode already available via cold-start fallback |

---

## Intake notes

- No scraping of LinkedIn, Indeed, Naukri, or ZipRecruiter was done or implied.
- No private user data was exposed or logged.
- No fake testimonials, fake metrics, or fake provider status added.
- All fixes reviewed and verified in code before commit.
