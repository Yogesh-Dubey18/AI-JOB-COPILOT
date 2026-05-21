# Incident Response Plan

Template status: operational draft requiring security review before public production use.

## Incident Types

- Secret exposure.
- Unauthorized account access.
- Resume or personal data exposure.
- AI provider data mishandling.
- Billing/payment issue.
- Service outage.
- Abuse or spam risk.

## First 30 Minutes

1. Confirm whether the report is real.
2. Stop further exposure if possible.
3. Preserve logs without exposing private data.
4. Rotate affected credentials if any secret is involved.
5. Record timeline and owner.

## First Day

- Assess affected users and data.
- Patch or disable affected feature.
- Update environment variables in provider dashboards only.
- Prepare user communication if required.
- Review legal notification obligations with a professional.

## Post-Incident

- Write a private incident report.
- Add regression tests where possible.
- Update docs, monitoring, and runbooks.
- Close feedback or issue records only after remediation is verified.
