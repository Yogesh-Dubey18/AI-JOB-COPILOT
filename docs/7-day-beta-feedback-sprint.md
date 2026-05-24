# 7-Day Beta Feedback Sprint

This document outlines a structured, daily operational plan for the founder to collect feedback, prioritize patches, and iterate during the first week of the **AI Job Copilot v2 Beta** launch.

---

## 🗓️ Daily Sprint Schedule

### Day 1: Launch & Initial Intake
- **Goal:** Launch announcement and monitor system stability.
- **Tasks:**
  - Post the announcements on LinkedIn, X, and internal groups using the [Beta Announcement Pack](marketing/beta-announcement-pack.md).
  - Reach out directly to the first 5 target testers using the [Beta Tester Invite Kit](beta-tester-invite-kit.md).
  - Monitor backend `/health` status and Render/Vercel logs.
  - Log any immediate sign-up or loading errors directly onto the [Beta Feedback Triage Board](beta-feedback-triage-board.md).

### Day 2: First Impressions & Intake
- **Goal:** Identify initial onboarding blocks and usability friction.
- **Tasks:**
  - Follow up with Day 1 testers to ensure they were able to register and login.
  - Check database contact/resume counts to confirm successful creation.
  - Triage new submissions on the triage board.
  - Group feedback into "Critical Bugs" vs "UX Friction".

### Day 3: Minor Patches & Deploy
- **Goal:** Address early friction points and deploy quick fixes.
- **Tasks:**
  - Fix high-priority layout bugs or client-side crashes identified on Day 2.
  - Test fixes locally, run standard verification, and deploy to Vercel/Render.
  - Send update notices to affected beta testers.

### Day 4: Outreach & Mid-Point Check
- **Goal:** Deepen engagement and verify core features (Resume Parser / CRM).
- **Tasks:**
  - Send follow-up messages asking testers to run through the 10-minute walkthrough in [Beta Test Scripts](beta-test-scripts.md).
  - Audit database application tracker logs to see if users are successfully using the Kanban board.
  - Track metrics using [Beta Success Metrics](beta-success-metrics.md).

### Day 5: Deep-Dive Triage
- **Goal:** Address more complex issues like AI parsing quality or mock responses.
- **Tasks:**
  - Triage medium-to-low priority issues.
  - Optimize prompt templates if users report low-quality ATS scores or irrelevant recommendations.
  - Update the [Beta Feedback Triage Board](beta-feedback-triage-board.md) cards status.

### Day 6: Backlog & Feature Request Review
- **Goal:** Organize feature requests and future scope.
- **Tasks:**
  - Review all feature requests submitted via GitHub or forms.
  - Update the product backlog and assign items to future milestones (e.g., Post-Beta Release).
  - Draft patch notes for the final Day 7 update.

### Day 7: Retrospective & Sprint Review
- **Goal:** Evaluate beta success and plan next steps.
- **Tasks:**
  - Run the week 1 retro using the [Beta Week 1 Review Template](beta-week-1-review-template.md).
  - Aggregate feedback stats (active testers, bug count, response rate).
  - Update the public readme/changelog if a stable patch release is warranted.
