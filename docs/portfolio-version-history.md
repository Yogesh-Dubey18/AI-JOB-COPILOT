# Portfolio Version History

Last updated: 2026-05-27

This document covers the implemented Portfolio Version History phase. It is an authenticated portfolio editing feature. It does not publish data publicly unless the portfolio owner has explicitly enabled public visibility.

## What Is Implemented

- Protected version endpoints under `/api/portfolios/:id/versions`.
- Save current portfolio as a version with:
  - version title
  - created date
  - visibility status at save time
  - change summary
  - private snapshot of portfolio content
- List saved versions for the signed-in owner.
- Compare a saved version against the current portfolio.
- Restore a saved version while preserving the current slug.
- Restore keeps current public/private visibility by default to avoid accidentally publishing old content.

## API Behavior

```text
GET /api/portfolios/:id/versions
POST /api/portfolios/:id/versions
GET /api/portfolios/:id/versions/:versionId/compare
POST /api/portfolios/:id/versions/:versionId/restore
```

All version endpoints require authentication. Users can only access their own portfolio versions.

## Restore Safety

Restore intentionally preserves the current slug. It also preserves the current `isPublished` state unless `restoreVisibility` is explicitly passed as `true` by a trusted caller. The current frontend uses the safe default and does not force old visibility settings back onto the public site.

## Snapshot Fields

The saved snapshot includes the portfolio content fields needed to recover a prior draft:

- title
- display name
- hero/headline/about
- skills
- projects
- project case studies
- proof mappings
- resume/contact/social links
- theme
- section visibility controls
- public/private status at save time

Snapshots are private authenticated data and are never returned by the public `/u/[slug]` route.

## Privacy Rules

- Public profiles do not expose version history.
- Version snapshots can contain private notes, private proof mappings, and contact data, so they must remain owner-scoped.
- Restoring a version resyncs the public projection through the same privacy filters used by the portfolio builder.
- No version should be treated as an audit guarantee or third-party verification record.
