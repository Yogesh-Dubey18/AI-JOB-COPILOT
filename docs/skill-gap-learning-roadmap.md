# Skill Gap Analyzer & Learning Roadmap

The Skill Gap Analyzer compares a user's current skills (parsed from their resume or manually inputted) with the requirements of a target role or a specific selected job. It produces a dynamically calculated gap analysis and a structured learning curriculum.

---

## Key Features

### 1. Heuristic & AI Skill Comparison
The analyzer pulls data from multiple sources:
- **Resume parsed skills**: From the user's uploaded resumes.
- **Selected job description**: Required skills and title keywords from selected applications.
- **AI enhancement**: If configured, Gemini/OpenAI refines the list of gaps. If unconfigured, the system runs a deterministic case-insensitive comparison of required skills versus current skills.

### 2. Interactive Learning Roadmaps
The analyzer constructs two distinct learning schedules:
- **7-day Revision Sprint**: High-priority topics for fast revision.
- **30-day Improvement Curriculum**: A deeper week-by-week program for mastering new skills.
Checkboxes on both roadmaps update overall progress in the database via the `PATCH /api/ai/skill-gap/plans/:id` endpoint.

### 3. Curated Fallback Resources
When live API integrations for paid course providers are not connected, the system provides a curated Reference Resource Library covering:
- Frontend (React, HTML/CSS, Tailwind)
- Backend (Node.js, Express)
- Database (MongoDB, SQL basics)
- Core Fundamentals (Git/GitHub, DSA, System Design, Deployment, HR/Interview Prep)

Every resource card is honestly labeled: *"Curated fallback resources — external course provider is not connected. Do not fake paid/course API integrations."*

### 4. Ethical Warnings
The workspace prominently features an ethical warning banner:
> **Do not add skills to your resume unless you can explain them in an interview.** Faking skills leads to quick technical assessment failure.

---

## Database Schema (LearningPlan)
```typescript
const LearningPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetRole: String,
    missingSkills: [String],
    prioritySkills: [String],
    sevenDayPlan: [String],
    thirtyDayPlan: [String],
    projectSuggestions: [String],
    progress: { type: Number, default: 0 }
  },
  { timestamps: true }
);
```

---

## Workflow Statuses
The Guided Workflow tracks progress through the following statuses:
1. **Not started**: No learning plans have been generated.
2. **Gaps identified**: Learning plan exists, identifying missing skills.
3. **Roadmap generated**: 7-day and 30-day roadmaps are fully populated.
4. **Practice started**: User has completed checklist items, updating progress to > 0%.
