# Advanced Analytics v2

Phase 40 upgrades analytics from simple counters into job-search intelligence. The goal is to help a job seeker understand quality, consistency, conversion, and follow-up risk without claiming guaranteed selection.

## Backend Services

Services:

- `analytics.service.ts`
- `job-search-intelligence.service.ts`

The analytics overview now includes:

- Application funnel.
- Resume score trend.
- Application status mix.
- Best job sources from tracked applications.
- Missing skills from job matches and resume analyses.
- `jobSearchHealth` score and recommendations.

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/analytics/overview` | Full analytics dashboard payload. |
| `GET` | `/api/analytics/applications` | Application status chart data. |
| `GET` | `/api/analytics/resume-score` | Resume score trend. |
| `GET` | `/api/analytics/skills` | Missing skill frequency. |
| `GET` | `/api/analytics/job-search-intelligence` | Health score, funnel, velocity, follow-ups, risks, and next actions. |

## Job-Search Health Score

The score is a 0 to 100 signal based on:

- Profile completeness.
- Latest resume ATS score.
- Application velocity.
- Follow-up hygiene.
- Interview conversion.
- Skill focus.

It is not a hiring prediction. It is a practical operating metric for improving the user's job-search process.

## Dashboard Widgets

The dashboard now surfaces:

- Job-search health score.
- Health level.
- First recommended next action.
- Top missing skills from real job match/resume analysis records where available.

The analytics page now surfaces:

- Health score card.
- Score breakdown.
- Next actions.
- Risk flags.
- Existing Recharts visualizations.

## Data Sources

Primary sources:

- `Application`
- `ResumeAnalysis`
- `JobMatch`
- `Profile`
- `Interview`

Derived outputs:

- `funnel`
- `velocity`
- `conversion`
- `followUpsDue`
- `staleApplications`
- `topMissingSkills`
- `bestNextActions`
- `riskFlags`

## Safety And Honesty

- Do not call health score a selection probability.
- Do not imply job offers are guaranteed.
- Do not invent application volume, interview outcomes, or source performance.
- Keep recommendations process-focused and user-reviewed.

## Future Improvements

- Persist periodic analytics snapshots.
- Add cohort-free local trend comparison.
- Add source quality scoring.
- Add resume version performance analytics.
- Add notification nudges from intelligence signals.
- Add privacy-preserving public portfolio visit analytics.
