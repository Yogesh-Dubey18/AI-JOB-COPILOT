# Proof File Audit Trail + User Review History

Last updated: 2026-05-28

This phase adds an owner-scoped audit trail for portfolio proof files. It records file actions and review decisions, not file contents.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Audit event model | Implemented | Dedicated proof-file audit records track portfolio, file, optional project/proof mapping, event type, actor, status/visibility changes, and safe summary. |
| Owner-scoped endpoints | Implemented | Owners can list recent proof activity and per-file history. Other users receive the same portfolio ownership boundary as existing file routes. |
| Flow integration | Implemented | Upload, local validation, visibility changes, public approval/revocation, signed URL refresh, attach/detach, and delete events are recorded. |
| Public portfolio privacy | Implemented | `/u/[slug]` never returns audit events, private notes, private file internals, or signed URL internals. |
| Frontend history UI | Implemented | `/portfolio-generator` shows a proof file activity panel and per-file audit history with safe summaries only. |

## Audit Event Types

- `uploaded`
- `local_validated`
- `scan_status_changed`
- `visibility_changed`
- `public_approved`
- `public_revoked`
- `signed_url_generated`
- `downloaded`
- `attached_to_project`
- `detached_from_project`
- `deleted`

`downloaded` is reserved for app-proxied download flows. The current owner refresh action records `signed_url_generated` without storing the token.

## Audit Record Fields

Each record can include:

- `eventId`
- `ownerId`
- `portfolioId`
- `fileId`
- `projectId`
- `proofMappingId`
- `eventType`
- `previousStatus`
- `newStatus`
- `previousVisibility`
- `newVisibility`
- `createdAt`
- `actor`: `user` or `system`
- `summary`

Summaries are intentionally short and safe. They explain the action without copying file content, storage internals, credentials, signed URLs, or private notes.

## What Is Logged

- Proof file was added to the owner-scoped vault.
- Local validation completed.
- Scan status changed.
- Visibility changed between `private` and `publicApproved`.
- Public approval was granted or revoked.
- A signed URL was generated for the owner.
- File was attached to or detached from a project case study or skill proof mapping.
- File was deleted.

## What Is Never Logged

- File contents.
- Resume text, screenshot contents, or PDF text.
- Absolute local paths.
- Private S3/R2 bucket URLs.
- Raw storage keys in public output.
- Full signed URLs, query tokens, signatures, or private bucket URLs.
- Provider credentials or API tokens.
- Private proof notes unless a future field is explicitly reviewed and marked safe.

## Backend Endpoints

Owner-protected routes:

```text
GET /api/portfolios/:id/files/activity
GET /api/portfolios/:id/files/:fileId/activity
```

Supported optional filters:

- `eventType`
- `projectId` on recent portfolio activity
- `limit`

All audit endpoints require authentication and portfolio ownership. They return 404 for non-owners instead of exposing whether a file exists.

## Frontend Behavior

`/portfolio-generator` shows:

- Proof file activity panel.
- Recent owner activity timeline.
- Per-file audit history under current proof files.
- Actor badge for `user` or `system`.
- Visibility and scan status transitions when relevant.
- Privacy explanation: "Audit history tracks file actions, not file contents."

`/u/[slug]` never shows:

- Audit events.
- Event IDs.
- Owner-only activity history.
- Signed URL internals.
- Private file metadata.
- Private proof notes.

## Signed URL Safety

The app records that a short-lived signed URL was generated, but it never stores the full URL, query token, provider signature, private bucket URL, or local disk path in the audit trail.

## Verification Checklist

- Upload creates `uploaded` and `local_validated` events.
- Visibility change creates `visibility_changed` plus `public_approved` or `public_revoked`.
- Signed URL refresh creates `signed_url_generated` with no token or storage URL.
- Delete/detach creates `detached_from_project` and `deleted` events.
- Audit list requires ownership.
- Public portfolio responses do not include audit events.
- Audit records do not expose local paths, private bucket URLs, raw storage keys, signed tokens, or file contents.
