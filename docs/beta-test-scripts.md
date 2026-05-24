# Beta Test Scripts

Use these test scripts to guide testers through the application. Directing testers to perform specific tasks helps uncover edge cases and layout bugs across different devices and browsers.

---

## 🏃 Script 1: The 10-Minute Walkthrough (Core Path)
*Goal: Validate register, onboarding, resume upload, and job matching.*

1. **Sign Up:**
   - Go to the deployed frontend: `https://ai-job-copilot-frontend.vercel.app`
   - Click "Get Started" and register a new account.
   - Verify redirect to the dashboard.
2. **Upload Resume:**
   - Navigate to `/resume/upload` (Upload Resume link on the sidebar).
   - Drag and drop or select a resume PDF file.
   - Verify parsing succeeds and fields (Name, Email, Skills, Work History) are populated.
3. **ATS Analysis:**
   - Navigate to the ATS Analyzer page.
   - Click "Analyze Resume" for your uploaded resume.
   - Verify you receive an ATS score, keyword breakdown, and list of missing skills.
4. **Discover Jobs:**
   - Go to the jobs feed (`/jobs`).
   - Try applying a filter (e.g., Remote or Salary).
   - Save at least 2 jobs by clicking the bookmark/save icon.

---

## 🔍 Script 2: The 30-Minute Deep Test (Full Loop)
*Goal: Validate cover letter generation, CRM contacts, tracking Kanban, interview prep, and localization.*

1. **Application Kit:**
   - Go to `/apply-assistant` (Apply Assistant).
   - Select one of your saved jobs and your parsed resume.
   - Click "Generate Kit".
   - Verify AI generates a Cover Letter, HR Email, and LinkedIn outreach message.
2. **Recruiter Contacts:**
   - Navigate to `/contacts` (Recruiter CRM).
   - Add a test contact (Name: "Sarah Recruiter", Company: "Google", Email: "sarah@google.com").
   - Verify the contact card appears in the grid.
3. **Application Tracker:**
   - Go to the tracker board (`/applications`).
   - Move a card from the "Saved" column to the "Applied" column.
   - Click the card to open details, add a follow-up reminder date, and save.
4. **Mock Interview Practice:**
   - Go to `/interviews` (Interview Prep).
   - Create a mock interview session for "Software Engineer".
   - Submit practice answers to the AI prompt questions.
   - Verify you get scored and receive feedback.
5. **Localization & Notifications:**
   - Navigate to settings (`/settings/notifications` and dashboard languages).
   - Toggle notification preferences and save.
   - Change localization settings and verify layout adaptations.

---

## 📱 Script 3: Mobile UX & Responsiveness Test
*Goal: Ensure the layout works seamlessly on mobile devices.*

1. **Sidebar Navigation:**
   - Access the app on a mobile device or resize your browser to mobile width (< 768px).
   - Open the hamburger menu and verify links are clickable.
   - Close the hamburger menu.
2. **Form Layouts:**
   - Go to `/resume/upload` and `/contacts`.
   - Verify input fields do not overflow the screen container.
   - Verify buttons are large enough for comfortable touch interaction (minimum tap target of 44x44px).
3. **Kanban Drag-and-Drop:**
   - Try moving application cards on the mobile tracker view.
   - Verify it handles swipes or tap-to-move falls back gracefully.

---

## 🔒 Script 4: Privacy & Anonymization Audit
*Goal: Confirm user details are protected before AI parsing.*

1. **Redaction Toggle:**
   - Navigate to `/resume/upload`.
   - Toggle the "Anonymize Resume" option before upload.
   - Check the parsed data fields.
   - Verify that placeholders (e.g., `[REDACTED_NAME]`, `[REDACTED_EMAIL]`) are generated in place of real personal identifying details.
2. **Export Check:**
   - Export your tailored resume to PDF.
   - Verify the exported file does not leak private details if redaction was enabled.
