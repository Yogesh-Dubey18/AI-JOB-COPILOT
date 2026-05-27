# Dynamic Portfolio Builder And Public Slugs

Last updated: 2026-05-27

This document covers the implemented Dynamic Portfolio Builder & Public Slugs phase. It is an app-level public portfolio feature, not a custom-domain hosting provider activation.

## What Is Implemented

- Protected portfolio builder at `/portfolio-generator`.
- Public portfolio route at `/u/[slug]`.
- Safe unavailable state when a slug is missing, private, or unpublished.
- Public/private portfolio status controlled by the user.
- Slug editor with validation, reserved-word blocking, availability checks, and duplicate conflict prevention.
- Portfolio title, display name, headline, about summary, skills, projects, GitHub link, LinkedIn link, and resume PDF URL fields.
- Privacy controls for email, phone, resume PDF, roadmap achievements, and social links.
- Public profile projection that returns only approved public fields.
- SEO metadata for published public profiles, using only the public portfolio endpoint.
- Portfolio PDF generation and download through the existing PDF export system.
- Portfolio version history with save, list, compare, and safe restore actions.
- Project case-study builder with proof status labels and public approval controls.
- Skill-to-proof mapping cards that connect skills to projects, resume bullets, and proof links.

## Public Slug Behavior

Public portfolios are available at:

```text
/u/[slug]
```

Slug rules:

- 3 to 30 characters.
- Lowercase letters, numbers, and single hyphens only.
- Cannot start or end with a hyphen.
- Reserved words such as `admin`, `api`, `login`, `dashboard`, `portfolio`, and `settings` are blocked.
- Explicit duplicate slugs are rejected with a user-friendly conflict error.
- The app does not silently publish a duplicate under a surprise URL.

## Privacy Model

Default portfolio behavior is private/safe.

The public endpoint exposes:

- Title, display name, headline, about/bio.
- Skills only when skills are enabled.
- Projects only when projects are enabled.
- GitHub/LinkedIn links only when social links are enabled.
- Resume URL only when resume download is enabled.
- Email only when email is enabled.
- Phone only when phone is enabled.
- Roadmap achievement summary only when roadmap achievements are enabled.
- Project case studies only when projects, case studies, and per-case-study public approval are enabled.
- Skill proof mappings only when proof mapping visibility and per-mapping public approval are enabled.

The public endpoint does not expose user IDs, private resume records, auth data, tokens, provider credentials, or unpublished portfolios.

Private case-study notes and private proof-mapping notes are never returned by the public endpoint. GitHub, live demo, and screenshot links for case studies are withheld when social links are disabled.

## Data Sources

The builder can seed or use available user-owned data from:

- Resume profile and parsed resume fields.
- Structured resume projects and skills.
- Career vault project entries.
- Skill roadmap priority skills and progress.
- GitHub and LinkedIn profile links when the user provides them.
- Career vault project details for case-study seeds.
- Skill roadmap priority skills for suggested proof-improvement cards.

If no data exists, the builder shows safe empty-state CTAs:

- Upload resume.
- Add skills.
- Add projects.
- Generate portfolio later.

## PDF Export Behavior

Portfolio PDF export uses:

```text
POST /api/exports/portfolio/:id
```

The export respects portfolio privacy settings. If local storage fallback is active, generated PDFs may be reachable by direct local upload URL. S3/R2 private storage with signed URLs is required before treating exports as durable production assets.

## Provider Honesty

What is real now:

- App slug route `/u/[slug]`.
- Public/private visibility controls.
- Privacy-filtered public profile endpoint.
- Existing PDF export workflow.
- Protected version history and safe restore workflow.
- Owner-maintained project case studies and proof mappings.

What is provider-ready only:

- Custom portfolio domains.
- Automated Vercel domain provisioning.
- Durable private object storage through S3/R2.

The app must not claim permanent public hosting, custom domain provisioning, or S3/R2 storage until those providers are configured and verified.

## Proof Mapping Honesty

The builder displays the rule:

```text
Do not claim skills, results, or metrics that you cannot explain or prove.
```

Proof statuses are owner-maintained labels:

- `verified`: the user believes they can explain/prove it.
- `self-reported`: the project or skill claim is user-entered and not externally verified.
- `missing`: proof needs to be added before showing it publicly.

The app does not fake GitHub stats, fake testimonials, fake provider verification, or fake project metrics.
