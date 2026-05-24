# Beta Success Metrics

This document outlines key performance indicators (KPIs) to evaluate the success of the **AI Job Copilot v2 Beta** release and monitor runtime metrics.

---

## 📊 KPI Dashboard Matrix

| Metric Category | Specific KPI | Target / Goal | Actual (Beta Week 1) | Measurement Method |
|---|---|---|---|---|
| **Activation** | User Signups | 50+ Users | *[TBD]* | MongoDB total users count |
| **Activation** | Resume Parse Rate | > 85% success | *[TBD]* | Backend logs on parse endpoints |
| **Engagement** | Saved Jobs / User | > 4 jobs | *[TBD]* | DB query: Average jobs saved |
| **Engagement** | Tailored Kits Generated | > 3 per active user | *[TBD]* | DB query: Average kits generated |
| **CRM / Tracker**| Kanban Board Updates | > 5 card moves / user | *[TBD]* | Audit logs on application patch |
| **Quality** | Bug Reports | < 15 unique bugs | *[TBD]* | [Triage Board](beta-feedback-triage-board.md) count |
| **Cost Control** | Average API Cost / User| < $0.50 | *[TBD]* | OpenRouter/Gemini Console tracking |
| **System** | `/health` Uptime | 99.9% uptime | *[TBD]* | UptimeRobot / Sentry logs |

---

## 🔒 Cost & Limit Enforcement Rules
To prevent API abuse during the free public beta, we enforce the following system limits:
1. **Resume Parse Limit:** Maximum of 3 resumes uploaded per user account per day.
2. **AI Application Kit Generation:** Maximum of 5 tailored cover letters/outreach templates per user account per day.
3. **Interview Practice Sessions:** Maximum of 2 mock interviews per user account per day.
4. **General Rate Limiting:** 60 requests per minute per IP address on the backend API.

---

## 📈 Metric Review Schedule
- **Weekly Progress Report:** Founder reviews database telemetry every Sunday during the beta.
- **Cost Audit:** Review API key billings daily to ensure no spike due to scraping or abuse.
- **Post-Beta Decision:** If signups > 50, parse success > 85%, and average NPS (Net Promoter Score) > 8, the app is declared ready for stable commercial/subscription billing deployment.
