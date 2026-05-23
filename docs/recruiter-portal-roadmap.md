# Recruiter Portal Roadmap

**Status:** Interest collection only. No active recruiter tools. No candidate data exposure.  
**Updated:** May 2026

---

## Current Status

The recruiter portal is in **roadmap / pre-launch** stage. The public-facing page at `/recruiters` exists to collect employer interest and document the privacy model.

**What is implemented now:**
- Public `/recruiters` page with privacy commitments, feature roadmap, and interest form (disabled)
- Candidate scam detector (candidate-facing, not recruiter-facing)
- Job scam safety signals in job listings

**What is NOT yet implemented:**
- Active recruiter accounts
- Employer dashboard
- Candidate database browsing (by design — never without consent)
- Real interest form submission
- Recruiter-facing API endpoints

---

## Privacy Model

| Principle | Implementation |
|-----------|---------------|
| Candidate data is private | No recruiter can browse private resumes or contact details |
| Consent required | Candidates must explicitly opt-in before any match signals are shared |
| Anonymized first | Match signals are anonymized — no name, email, or phone exposed without consent |
| No data selling | Candidate data is never sold, rented, or licensed |
| No auto-apply | Every application requires candidate review and confirmation |
| Verified recruiters only | All recruiter accounts must pass company email verification |
| Scam-safe | Job postings are checked for scam signals before going live |

---

## Candidate Consent Model

When Phase D (consent-based sharing) launches:
1. Candidate sees a clear opt-in prompt: "Share anonymous match signals with verified employers?"
2. Candidate selects which signal categories to share (skills, experience level, availability)
3. Candidate can revoke consent at any time from Settings
4. Employer receives only the consented signals — not PII
5. Employer cannot contact candidate directly until candidate accepts interview request

---

## Recruiter Verification Plan

Phase B requirements (planned):
1. Work email domain must match registered company domain
2. LinkedIn company page URL must be provided
3. Company must not appear in known scam/fraud databases
4. Manual review for companies with no verifiable online presence
5. Verified badge shown to candidates in recruiter messages

---

## Anti-Scam Plan

- All job postings pass automated scam signal checks (same engine as candidate scam detector)
- No advance fee, registration fee, or training fee jobs allowed
- Company verification required before first job post
- Candidate can report suspicious recruiter from every interaction
- Flagged recruiters are suspended pending review

---

## Required Backend/Provider Work

Before any recruiter tools launch:
- [ ] Recruiter user model and roles (separate from candidate users)
- [ ] Company profile model with verification status
- [ ] Candidate consent model and preferences
- [ ] Job posting model with scam signal scoring
- [ ] Anonymized candidate match signal API
- [ ] Recruiter-facing dashboard frontend
- [ ] Recruiter email/notification system (requires email provider)
- [ ] Calendar scheduling integration (requires Google Calendar or equivalent)

---

## Required Legal/Privacy Review

Before public launch:
- [ ] Privacy policy updated to cover recruiter data flows
- [ ] Terms of service updated for employer accounts
- [ ] Data processing agreement with AI providers covering recruiter use cases
- [ ] GDPR/DPDPA compliance review for employer-candidate data exchange
- [ ] Legal review of consent model and data retention policies

---

## Manual Testing Checklist (Current)

- [ ] /recruiters page loads without errors
- [ ] Privacy commitments section is visible
- [ ] Recruiter portal roadmap is visible
- [ ] Interest form is visibly disabled with clear "not live yet" label
- [ ] No candidate data visible on page
- [ ] No fake "join now" recruiter access claims
- [ ] Candidate privacy link (to /privacy) works
- [ ] Register link (for candidates) works
