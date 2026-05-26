# AI Application Answer Synthesizer & Tone Selector

The AI Application Answer Synthesizer is a core module that helps job seekers draft personalized answers for common job application screening questions. It is designed to prioritize user-confirmation and safety, enforcing a **review-first** manual workflow.

---

## 1. Supported Question Types (10 Key Categories)

The synthesizer generates specific, tailored drafts for 10 standard application and screening questions:

1. **Why are you a good fit?** (`whyHireYouAnswer`)
   - Highlights matching resume skills against job description requirements.
2. **Why this company?** (`whyCompanyAnswer`)
   - Aligns the candidate's career goals with company details and mission.
3. **Tell us about yourself** (`tellMeAboutYourselfAnswer`)
   - Briefly introduces the candidate's background, core tech stack, and experience.
4. **Salary expectation** (`salaryAnswer`)
   - Formulates a professional, standard response expressing openness to market rates.
5. **Notice period** (`noticePeriodAnswer`)
   - Drafts standard availability notes based on current notice constraints.
6. **Work authorization** (`workAuthorizationAnswer`)
   - Confirms local authorization status and sponsorship requirements.
7. **Assignment submission** (`assignmentSubmissionAnswer`)
   - Formulates a polite, clean message to accompany coding assignments or test assessments.
8. **Follow-up message** (`followUpMessageAnswer`)
   - Drafts polite follow-up messages for recruiters or hiring managers regarding application status.
9. **Rejection response** (`rejectionResponseAnswer`)
   - Formulates a gracious, professional response to maintain networking relations after a rejection.
10. **Interview confirmation** (`interviewConfirmationAnswer`)
    - Confirms availability and attendance details for scheduled interviews.

---

## 2. Tone and Mode Options (7 Standard Tones)

Candidates can select between 7 distinct communication tones, adapting the language to their target organization:

* **Professional**: Standard, objective, polished, corporate.
* **Fresher-friendly**: Enthusiastic, eager to learn, project-focused, modest.
* **Technical**: Detailed-oriented, highlighting tech stack, database schemas, and API design.
* **Confident**: Assertive, highlighting ownership, business outcomes, and key achievements.
* **Polite follow-up**: Gracious, structured follow-up style.
* **Short recruiter DM**: Direct, concise message optimized for social media (e.g. LinkedIn DMs).
* **Formal email**: Traditional business letter formatting.

---

## 3. Safe AI Fallback System (Deterministic Heuristics)

If the external AI provider (OpenAI or Gemini API) is unconfigured or unavailable:
* The system utilizes **deterministic templates** customized dynamically using the chosen `tone`, `jobTitle`, `companyName`, and calculated `matchingSkills`.
* The frontend workspace displays a visible **"Fallback Template Mode"** banner to communicate honestly about the template source without faking live AI provider outputs.
* No credentials or API keys are exposed.

---

## 4. Safety Constraints & Manual Workflow

* **No Automated Submission**: All generated drafts must be copied and submitted manually by the user. The platform does not perform anti-detection stealth, browser automation, or auto-apply.
* **Disclaimer Banners**: All interfaces include clear "Manual Review Required" warnings.
* **Timeline Logging**: Drafts can be reviewed, edited inline, and logged directly to the Application timeline history to track user activity.
