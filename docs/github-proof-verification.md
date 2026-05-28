# GitHub Proof Verification Provider-Ready Integration

Last updated: 2026-05-28

This document describes the GitHub proof verification readiness phase for portfolio case studies and skill proof mappings. The goal is honest evidence linking, not fake verification or fake repository metrics.

## Current Status

- Public GitHub repository URL parsing is implemented.
- Manual fallback mode is implemented for public repo URLs when credentials are missing.
- Provider-ready status is exposed through `/api/portfolios/github/status`.
- Proof check action is available in `/portfolio-generator` for project case studies and skill proof mappings.
- Public `/u/[slug]` output shows GitHub proof only when the owner enables the `showGitHubProof` gate.
- GitHub API metadata is fetched only when backend credentials are configured and the request succeeds.

Provider status rules:

- `Live`: only after `GITHUB_TOKEN` or GitHub OAuth credentials are configured and a metadata request succeeds.
- `Provider-ready`: env placeholders or credentials exist, but a real metadata request has not been verified.
- `Manual fallback`: no API metadata is fetched; the repo URL is parsed and treated as owner-maintained proof.
- `Not configured`: GitHub API provider keys are absent and manual fallback is not being used for that context.

## Environment Variables

Backend placeholders:

```env
GITHUB_TOKEN=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Do not commit real values. Configure production values only in Render or the backend deployment provider.

## GitHub URL Parser

Accepted input:

```text
https://github.com/owner/repo
https://github.com/owner/repo/tree/main
https://github.com/owner/repo.git
```

The parser extracts:

- owner
- repo
- canonical repo URL

Rejected input:

- non-GitHub URLs
- URLs that do not include `owner/repo`
- reserved GitHub paths such as topics, marketplace, settings, or login

## Metadata Boundary

When `GITHUB_TOKEN` is configured and a request succeeds, the backend may return:

- repo name
- description
- languages
- README presence
- last updated date
- public URL
- default branch
- topics

The app does not return, invent, or display fake stars, forks, commit counts, contributors, testimonials, or verification claims.

## Confidence Rules

| Confidence | Meaning |
|---|---|
| `strong` | Public repo metadata exists, README is detected, and repo metadata/keywords match the project or skill. |
| `medium` | A valid GitHub repo URL exists, but no API-backed README/keyword evidence is available. |
| `weak` | No usable GitHub proof link or metadata exists. |
| `self-reported` | The owner indicates proof exists, but no verifiable source is attached. |

Proof badges are intentionally honest:

- GitHub-linked
- Self-reported
- Evidence available
- Missing proof

These badges do not imply GitHub, employers, or AI Job Copilot independently verified the project.

## Privacy Rules

- GitHub proof is hidden from `/u/[slug]` unless the owner enables `showGitHubProof`.
- Private notes are never returned by the public portfolio endpoint.
- Private proof file metadata and private storage keys remain hidden.
- Public portfolio output may include only public-approved repository links and safe metadata.
- Checking a GitHub proof link does not automatically publish it.

## Portfolio Builder Behavior

`/portfolio-generator` includes:

- GitHub provider status badge.
- GitHub proof URL field for each project case study.
- GitHub proof URL field for each skill proof mapping.
- `Check GitHub proof` action.
- Confidence badge and evidence summary.
- Public visibility toggle for GitHub proof.
- Notice that stars, forks, commits, and verification are not faked.

## Public Portfolio Behavior

`/u/[slug]` can show:

- public-approved GitHub proof link
- evidence badge
- README/language/topic/default branch metadata when available
- manual fallback text when API metadata is unavailable

It does not show:

- private notes
- hidden GitHub proof links
- fake metrics
- fake verification claims
- private repo data without OAuth consent

## GitHub Analyzer Integration

The GitHub Analyzer remains a manual/project-analysis workspace. Its provider notice now points to the portfolio proof boundary and clarifies that real GitHub metadata requires credentials and successful verification. A deeper analyzer-to-proof sync can be added later after OAuth consent and persistence rules are designed.

## Testing Checklist

- Valid GitHub URLs parse to owner/repo.
- Invalid GitHub URLs are rejected.
- Manual fallback responses do not include fake stars, forks, commits, or verification.
- Confidence logic returns strong, medium, weak, and self-reported states.
- Public portfolio output excludes hidden GitHub proof and private notes.
- UI shows provider-ready/manual fallback status honestly.
