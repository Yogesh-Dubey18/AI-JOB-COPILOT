# Project Case-Study Proof Mapping

Last updated: 2026-05-27

This document covers recruiter-facing project case studies and skill-to-proof mapping. The feature helps users explain real work clearly without inventing metrics, testimonials, or provider-backed proof.

## Implemented Schema

Each project case study can store:

- project name
- problem solved
- tech stack
- user role or contribution
- key features
- challenges faced
- solution approach
- result or learning
- GitHub link
- live demo link
- screenshots link
- proof status: `verified`, `self-reported`, or `missing`
- public approval flag
- private proof notes
- optional public proof note

Each skill proof mapping can store:

- skill name
- project where used
- resume bullet where mentioned
- GitHub or live proof link when available
- confidence: `strong`, `medium`, or `weak`
- public approval flag
- private notes
- optional public note

## Proof Logic

The builder can suggest proof mappings from user-owned data:

- resume skills
- resume projects
- career vault project entries
- skill roadmap priority skills
- project tech stacks

Suggested mappings are not treated as verified. They default to private and should be reviewed by the user before being shown publicly.

## Public Portfolio Behavior

The public `/u/[slug]` route only shows:

- published portfolios
- case studies marked public
- proof mappings marked public
- GitHub/live/screenshot links when social links are enabled
- public proof notes only when explicitly enabled

The public route does not show:

- private proof notes
- private proof mappings
- private case studies
- user IDs
- raw resume records
- fake proof claims
- fake metrics, testimonials, or success stories

## No Fake Proof Policy

Users are shown this warning in the builder:

```text
Do not claim skills, results, or metrics that you cannot explain or prove.
```

The `verified` proof status is user-maintained. It does not mean GitHub, LinkedIn, employers, or AI Job Copilot have independently verified the project. Public badges are rendered as proof status labels, not third-party verification claims.

## Production Notes

- GitHub proof can be improved later through a real GitHub API integration, but that remains provider-ready until configured.
- Screenshots should point only to user-approved safe assets.
- S3/R2 private storage and signed URLs are still required before private proof files or portfolio screenshots can be stored as production-grade assets.
