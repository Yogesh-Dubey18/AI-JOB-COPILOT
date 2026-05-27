# Advanced Interview Preparation — Feature Documentation

## Overview

The Advanced Interview Preparation module (`/interviews/prep`) is a comprehensive, review-first workspace that helps candidates prepare systematically for technical and HR interviews. All generated content is a draft template — no auto-sending, no auto-submitting, and no guaranteed success claims.

---

## Features

### 1. Interview Prep Modes (10 total)

| Mode | Label | Use Case |
|------|-------|----------|
| `hr` | HR interview | Behavioral, tell-me-about-yourself, why us |
| `technical` | Technical interview | REST, JWT, API design, databases |
| `react` | React frontend interview | Hooks, virtual DOM, state management |
| `node` | Node/Express backend interview | Event loop, middleware, async I/O |
| `mern` | MERN full stack interview | End-to-end request cycle, auth, aggregation |
| `javascript` | JavaScript basics | Closures, promises, event loop, prototype |
| `project` | Project explanation | Walk-through, tradeoffs, improvements |
| `fresher` | Fresher behavioral interview | First job, projects, teamwork |
| `salary` | Salary discussion | Research-based range, CTC, negotiation |
| `assignment` | Assignment discussion | Approach, assumptions, improvements |

---

### 2. Question Bank

- 5-7 deterministic fallback questions per mode with structured hints.
- Questions are labeled **"Fallback Template Mode — AI not configured"** when no AI API key is active.
- If an AI provider (OpenAI/Gemini) is configured, questions can optionally be enhanced.
- No live AI claims are made when the provider is absent.

---

### 3. STAR Answer Builder

The STAR builder guides candidates through the four-component behavioral answer framework:

- **Situation**: Context and challenge
- **Task**: Your specific responsibility
- **Action**: The steps you took (with technologies used)
- **Result**: Outcome with metrics if possible
- **Final Polished Answer**: Combined fluent answer for review

**Actions available:**
- **Generate Template**: Fills in mode-specific STAR draft templates
- **Edit Answer**: All fields are fully editable before use
- **Copy**: One-click clipboard copy for quick use
- **Save to Answer Vault**: Persists the answer with category tag `"Interview Prep — <mode>"`
- **Attach to Application Timeline**: Available when an application is selected

> **IMPORTANT:** All STAR templates are drafts. You must fill in your real experience before using them in an interview. Never read a template verbatim.

---

### 4. Interview Readiness Score

A heuristic-based self-assessment score (0–100) based on:

| Factor | Points |
|--------|--------|
| Resume uploaded | 15 |
| Job/interview selected | 15 |
| Company researched | 15 |
| Answer vault prepared (≥3) | 15 |
| Salary answer prepared | 15 |
| Project answer prepared | 15 |
| Mock session completed | 10 |

**Disclaimer:** This score is a self-assessment heuristic only. It does not guarantee interview success. Use it to identify preparation gaps.

---

### 5. Job / Company Context

When a job or application is selected:
- Shows company name, role title, required skills
- Displays suggested preparation topics
- Shows salary discussion notes based on the target role

If no job is selected: Safe empty state with a prompt to select or import a job.

---

### 6. Voice / Speech Support

> **Voice mock interview is provider-ready / future enhancement.**
> Text mock interview is available now.

No voice recording is implemented. The module is text-only for full control and review.

---

### 7. Guided Workflow Integration

The Guided Workflow page (`/guided-workflow`) now shows an **Interview Preparation Status** card with 4 states:

- `Not started` → Prompt to open Advanced Prep
- `Questions prepared` → At least 1 saved answer
- `Answers saved` → 3+ saved answers
- `Ready for mock interview` → 3+ answers including salary + project, or logged interviews

---

## API Endpoints

All endpoints require authentication (`requireAuth` middleware).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/interviews/prep/modes` | List all 10 prep modes |
| GET | `/api/interviews/prep/question-bank/:mode` | Fallback questions for a mode |
| POST | `/api/interviews/prep/star-template` | Generate STAR template (mode + question required) |
| POST | `/api/interviews/prep/save-to-vault` | Save STAR answer to Answer Vault |
| GET | `/api/interviews/prep/readiness` | Heuristic readiness score |
| GET | `/api/interviews/prep/context` | Job/company context for prep workspace |

---

## Safety & Limitations

- ❌ No auto-apply or auto-submit behavior
- ❌ No auto-send emails or messages
- ❌ No scraping of restricted job sites
- ❌ No voice recording without explicit provider activation
- ✅ All content is review-first and editable before use
- ✅ Fallback templates are labeled honestly
- ✅ Readiness score includes explicit disclaimer

---

## Future Improvements

- Live AI question enhancement when Gemini/OpenAI API keys are configured
- Voice mock interview (speech-to-text scoring) when provider is activated
- Job-specific STAR question suggestions based on job description parsing
- Integration with company research for company-specific prep tips
- Mock interview scoring with AI feedback on real answers
