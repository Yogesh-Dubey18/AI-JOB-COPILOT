# v2 Stabilization Bug Tracker

Track beta issues here until GitHub Issues are created.

| ID | Area | Issue | Severity | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| V2-BETA-001 | E2E | Playwright is not installed, so E2E command is skip-safe. | Medium | Open | Install `@playwright/test` and add active smoke tests when ready. |
| V2-BETA-002 | PDF | PDF renderer is functional but visually basic. | Low | Open | Upgrade templates and object storage before commercial use. |
| V2-BETA-003 | Extension | Extension is unpacked/developer-mode only. | Medium | Open | Add icons, store assets, privacy review, and packaging. |
| V2-BETA-004 | Providers | AI/email/billing/calendar/monitoring providers are mock/provider-ready by default. | Medium | Open | Configure env keys in deployment dashboards only. |
| V2-BETA-005 | Deployment | Live URLs are placeholders until real deployment is completed. | High | Open | Update docs only after verified live URLs are supplied. |

## Triage Rules

- High: blocks auth, data isolation, build/test, or deployment verification.
- Medium: blocks beta user testing but has a local workaround.
- Low: polish, copy, visual refinement, or future commercial hardening.

## Weekly Stabilization Loop

1. Run full verification.
2. Complete manual smoke flow.
3. Add newly found bugs here.
4. Convert confirmed bugs into GitHub Issues.
5. Fix issue by issue.
6. Update release notes.
