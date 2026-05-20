# Job Source System v2

Phase 27 upgrades the job source architecture while keeping imports manual, review-based, and legally safe.

## What Changed

- Added normalized job fields: normalized title/company, duplicate key, source type, review status, imported/last-seen timestamps, risk flags, and source metadata.
- Added duplicate detection for manual job imports.
- Added trust and scam-risk heuristics based on source baseline, apply URL, company website, personal recruiter email, suspicious fee language, and unrealistic salary signals.
- Added manual job import endpoint for reviewed user/admin-entered jobs.
- Added CSV preview endpoint that normalizes rows and flags duplicates without writing imported rows.
- Improved public job filters for workplace type, job type, location, skill, company, source type, fresher/internship flags, and minimum trust score.
- Improved jobs UI with filter controls, normalized result count, trust/risk/source indicators, and empty state.

## Safety Rules

- Do not scrape protected job sites.
- Do not auto-apply to jobs.
- Do not auto-send recruiter messages.
- Treat CSV import as preview/review first, not blind ingestion.
- Prefer official company career URLs when possible.
- Keep suspicious jobs visible only with clear risk flags and review status.

## Duplicate Key

The duplicate key combines normalized title, company, location, and apply host or apply URL. This catches common repeated postings while avoiding aggressive fuzzy matching that could merge different roles.

## Trust Scoring

Trust score starts from the source baseline:

- curated seed/source: 80
- manual company careers: 90
- admin CSV import: 70

The score is adjusted by apply URL evidence, company website evidence, and scam-risk score.

## Future Work

- Add admin approval queue for imported jobs.
- Add CSV write import after preview and validation.
- Add external source connectors only for approved/legal APIs.
- Add stronger company-domain verification.
- Add job expiration cleanup and last-seen refresh jobs.

