# Job Source Strategy

AI Job Copilot is a job-seeker assistant, not a job board. Job data must come from safe, legal, user-reviewed sources.

## Source Principles

- Prefer official company career pages, approved curated lists, and manual user/admin entry.
- Do not scrape protected job sites or bypass terms of service.
- Do not auto-apply to jobs.
- Keep apply actions manual and user-reviewed through official job links.
- Track source, apply URL, trust score, scam risk score, and review status.

## Current Architecture

The backend includes `job-source.service.ts` with source metadata, normalization helpers, duplicate-key generation, and source trust scoring.

Current source modes:

- `sample-seed-fallback`: local demo jobs for development and testing.
- `manual-company-careers`: reviewed jobs from official company career URLs.
- `admin-csv-import`: future-safe CSV import for approved job lists.

## Normalization

Imported jobs should normalize:

- title
- company
- location
- apply URL
- remote type
- job type
- required skills
- posted and expiry dates
- source ID
- trust score
- scam risk score

## Duplicate Detection

Use a lowercase duplicate key built from title, company, location, and apply URL. Exact duplicate prevention should be enforced when a durable import pipeline is added.

## Scam And Trust Signals

Trust scoring should consider:

- official company domain
- recruiter email domain
- salary realism
- payment or registration fee requests
- vague job descriptions
- missing company identity
- unrealistic promises
- source reliability

## Future Work

- Add admin CSV upload with validation preview.
- Add duplicate merge workflow.
- Add per-source review queues.
- Add source audit history.
- Add job freshness and expiry cleanup jobs.
