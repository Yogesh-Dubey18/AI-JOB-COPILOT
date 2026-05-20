# Documentation Quality Audit

This audit helps keep the documentation useful instead of becoming a pile of disconnected files.

## Current Strengths

- Setup, deployment, security, and production runbooks are separated by purpose.
- Career and job-search assets are organized into practical trackers and templates.
- Provider-ready features are documented with honest limitations.
- `docs/README.md` provides a central index.
- `npm run check:docs` verifies internal markdown links.

## Quality Checks

- [ ] Every new document is linked from `docs/README.md`.
- [ ] Internal links point to existing files.
- [ ] No document contains real secrets.
- [ ] No document claims fake production usage.
- [ ] Legal/business docs are labeled as templates when appropriate.
- [ ] Live URLs stay placeholders until verified.
- [ ] Commands are copy-paste safe for Windows/npm users.

## Known Documentation Risks

- The docs set is large, so the master index must be kept current.
- Some future provider integrations are architecture-ready, not production-connected.
- Screenshots and live URLs require manual update after real deployment.
- Career documents must be personalized with actual user achievements before use in applications.

## Maintenance Cadence

- After every phase: update `PHASE_PROGRESS.md`.
- After every docs addition: run `npm run check:docs`.
- Before release tags: review README, changelog, known limitations, and final audit docs.

