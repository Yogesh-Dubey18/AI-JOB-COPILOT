# Beta Daily Review Template

Perform these checks daily to maintain uptime, identify errors, and review incoming user submissions.

**Reviewer:** Yogesh Dubey  
**Date:** *[Fill Date]*  
**Time:** *[Fill Time]*

---

## 📋 Daily Checklist

- [ ] **1. System Health Check:**
  - Open `https://ai-job-copilot-backend-l6ut.onrender.com/health` in your browser.
  - Verify it returns `{"success":true,"data":{"status":"ok"}}`.
  - Record the uptime seconds: _________ seconds.

- [ ] **2. Hosting Logs Scan:**
  - Check Vercel console for runtime exceptions or bundle compilation warnings.
  - Check Render backend logs for mongoose database timeout connections or unhandled promise rejections.

- [ ] **3. In-App Feedback Intake:**
  - Check the database feedback collection for new user submissions:
    ```javascript
    db.feedbacks.find({ status: "new" });
    ```
  - Log any issues onto the [Triage Board](beta-feedback-triage-board.md).

- [ ] **4. Support Email / Inbox Sync:**
  - Check your developer inbox for email messages sent by testers.
  - Reply within 24 hours using the standard response templates in [Support Playbook](support-and-feedback-playbook.md).

---

## 📝 Daily Notes & Incident Logs
*Record any warnings, cold start delays, or minor layout errors noticed today.*

- **API Latency:** (Normal / High / Offline)
- **Reported Bug count today:** ______
- **Actions taken:**
