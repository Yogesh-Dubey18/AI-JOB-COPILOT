# Job Source Integrations

AI Job Copilot aggregates job listings from multiple sources. This document explains source types, honesty requirements, and how to activate live sources.

## Source Types

| Source | Status | Description |
|--------|--------|-------------|
| Curated demo | Active (fallback) | Structured sample listings for testing and UI development |
| LinkedIn Jobs API | Provider-ready | Requires partner approval from LinkedIn |
| Indeed Publisher | Provider-ready | Requires approved Indeed publisher account |
| Naukri API | Provider-ready | India-centric; requires Naukri partner credentials |
| ZipRecruiter | Provider-ready | US-focused; requires ZipRecruiter API access |
| Dice | Provider-ready | Tech-focused; requires Dice partner credentials |
| Company careers CSV | Planned | Import official job postings via CSV/RSS |

## Source Status Badge

Every JobCard shows a source badge:
- **Green with checkmark**: Provider is live and actively serving data
- **Grey "provider-ready"**: Provider is configured but credentials are missing; app is ready to activate

## Honesty Rules

1. **Never claim a provider is live** unless real credentials are configured and the API returns real data.
2. **Never scrape** LinkedIn, Indeed, Naukri, ZipRecruiter, Dice, or any job board without official API access.
3. **Do not auto-apply** to any job without explicit user review and action.
4. If provider credentials are missing, show `provider-ready` label and offer setup instructions at `/settings/integrations`.

## Match Explanation Fields

Each job returned from the backend may include:

| Field | Description |
|-------|-------------|
| `matchScore` | AI match score 0–100 |
| `whyMatched` | Short plain-text reason for the match |
| `strongFitSkills` | Skills from the resume that match the JD |
| `missingSkills` | Skills in the JD not found in the resume |
| `trustScore` | Scam trust score 0–100 |
| `riskFlags` | Array of risk warning strings |
| `sourceType` | Provider name (e.g. linkedin, indeed, curated) |

## Activating Live Sources

Set the corresponding env vars in `backend/.env` and restart the server:

```
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
INDEED_API_KEY=
NAUKRI_API_KEY=
ZIPRECRUITER_API_KEY=
DICE_API_KEY=
```

See `docs/provider-integrations.md` for full setup instructions.

## Backend Routes

- `GET /api/jobs` — paginated job listing with filters
- `GET /api/jobs/:id` — single job detail
- `GET /api/jobs/sources` — provider readiness status
- `POST /api/jobs/:id/save` — save job to user wishlist
