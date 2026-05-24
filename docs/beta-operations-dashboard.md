# Beta Operations Dashboard

This dashboard serves as the central hub for monitoring system health, triaging incoming tester reports, reviewing API token costs, and evaluating launch readiness during the **AI Job Copilot v2 Beta**.

---

## 🛠️ Operational Files Index
- **Metrics Telemetry Tracker:** [beta-metrics-tracker.md](beta-metrics-tracker.md)
- **Daily Operational Log:** [beta-daily-review-template.md](beta-daily-review-template.md)
- **Weekly Sprint Log:** [beta-weekly-review-template.md](beta-weekly-review-template.md)
- **Feedback Board:** [beta-feedback-triage-board.md](beta-feedback-triage-board.md)

---

## 🚦 Bug Severity Definitions
- **P0 - Critical (Blocker):** Security leaks (tokens, secrets, private customer profile data), authentication failures, server-wide 500 crashes, database timeouts. *(Fix target: < 12 hours)*.
- **P1 - High:** Core workflows failing (cannot upload resume, cannot search jobs, cover letter generation crashes). *(Fix target: < 24 hours)*.
- **P2 - Medium:** Minor functional issues or UI overlaps (mobile menu bugs, profile updates not saving, formatting glitches). *(Fix target: < 48 hours)*.
- **P3 - Low:** Spelling typos, CSS style tweaks, future feature suggestions. *(Fix target: Next release sprint)*.

---

## 🔄 Emergency Rollback Criteria
If a patch deployment triggers any of the following, trigger a roll back immediately:
1. **API Crash:** Backend `/health` endpoint returns 502/504 or crashes on startup.
2. **Auth Lock:** Users are locked out from logging in or registering.
3. **Data Loss:** Document queries fail or corrupt user resume records.

---

## 🚀 Public Launch Decision Criteria
We will transition from private beta to public launch only if we meet these thresholds:
1. **Total Signups:** > 50 active testers.
2. **Resume Upload Success Rate:** > 90% successfully parsed files.
3. **Bug Count:** 0 unresolved P0/P1 bugs.
4. **NPS / Usability Score:** > 8/10 from cohort reviews.
