# Interview Coach v2

Phase 41 upgrades interview preparation from one-off prompts into a session-based coach with role question banks, readiness scoring, history, and focused practice modes.

## Backend Additions

New model:

- `InterviewSession`

New service:

- `interview-coach.service.ts`

New prompt:

- `backend/src/ai/prompts/interviewCoach.prompt.ts`

New schema:

- `interviewCoachOutputSchema`

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/interviews/readiness` | Returns readiness score, score breakdown, focus areas, and next actions. |
| `GET` | `/api/interviews/history` | Returns coach sessions, mock interviews, and scheduled rounds. |
| `GET` | `/api/interviews/question-bank/:role` | Returns role-specific project, HR, DSA, and system design questions. |
| `GET` | `/api/interviews/coach/project` | Returns project-answer framework and project questions. |
| `GET` | `/api/interviews/coach/hr` | Returns HR-answer framework and HR questions. |
| `GET` | `/api/interviews/dsa-tracker` | Returns DSA categories, weekly target, and practice questions. |
| `POST` | `/api/interviews/sessions/start` | Starts a focused coach session. |
| `POST` | `/api/interviews/sessions/answer` | Scores an answer and advances the session. |

Existing mock routes remain available:

- `POST /api/interviews/mock/start`
- `POST /api/interviews/mock/answer`

## Readiness Score

The score is 0 to 100 and combines:

- Practice sessions.
- Scheduled interviews.
- Mock answer score average.
- Latest resume ATS score.

It is not a hiring prediction. It is a preparation quality signal.

## Focus Modes

- `project`: project explanation, architecture, ownership, tradeoffs.
- `hr`: concise behavioral and fit answers.
- `dsa`: basic coding and complexity explanation.
- `system-design`: entry-level design thinking.
- `mixed`: combined practice.

## Frontend Updates

Updated:

- `/interviews/mock`: readiness dashboard, focused sessions, answer scoring, project coach, HR coach, DSA tracker, and history link.

Added:

- `/interviews/history`: session, mock interview, and scheduled round history.

## Safety Rules

- Do not invent project experience.
- Do not invent employment or education history.
- Do not claim the score guarantees selection.
- Keep answers user-reviewed and truthful.
- Encourage project-specific evidence instead of generic claims.

## Future Improvements

- Voice recording and transcription.
- Rubric customization by company/role.
- DSA solved-problem persistence.
- Interview readiness trend chart.
- Company-specific question packs.
