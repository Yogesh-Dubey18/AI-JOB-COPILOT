# AI Job Copilot v2 Beta Release Notes

**Version:** `v2.0.0-beta`  
**Release Date:** May 2026  
**Frontend Deployment:** https://ai-job-copilot-frontend.vercel.app  
**Backend Deployment:** https://ai-job-copilot-backend-l6ut.onrender.com  

---

## 🚀 Key Features

This release introduces the **v2 Beta Career Operating Cockpit** for developers, interns, and early-career job seekers:

1. **AI Resume Parser & ATS Analyzer:** Analyze your resume score against target job descriptions and redact PII for privacy.
2. **Normalized Job Feed:** Integrated experience levels, contract types, and salary filtering.
3. **Application Tracker (Kanban):** Manage your pipeline from "Saved" to "Selected".
4. **CRM Recruiter Contacts:** Track recruiters' contact information, notes, and LinkedIn URLs.
5. **Interview Tracker:** Prepare using pre-interview checklists and STAR method guidelines.
6. **Career & Answer Vaults:** Store your career achievements and typical interview answers.
7. **Guided Job-Search Workflow:** Follow a step-by-step 7-stage checklist to streamline your search.

---

## 📋 Integration Status

AI Job Copilot is fully **provider-ready**:

- **MongoDB Atlas:** Live (active by default).
- **AI Providers (OpenAI/Gemini):** Provider-ready. Mock templates handle requests if credentials are not configured.
- **Stripe, SendGrid, Google OAuth:** Provider-ready. Standard mock bypass flows allow full system testing.

---

## 🛠️ Self-Hosting Setup

Follow the detailed guides in the documentation to activate your own instance:
1. Configure Render environment variables using [manual-dashboard-provider-setup-checklist.md](../manual-dashboard-provider-setup-checklist.md).
2. Follow the detailed steps in [provider-activation-runbook.md](../provider-activation-runbook.md) to obtain credentials.
