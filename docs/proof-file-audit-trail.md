# Proof File Audit Trail + User Review History

Last updated: 2026-05-29

This phase adds an owner-scoped audit trail for portfolio proof files. It records file actions and review decisions, not file contents.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Audit event model | Implemented | Dedicated proof-file audit records track portfolio, file, optional project/proof mapping, event type, actor, status/visibility changes, and safe summary. |
| Owner-scoped endpoints | Implemented | Owners can list recent proof activity and per-file history. Other users receive the same portfolio ownership boundary as existing file routes. |
| Flow integration | Implemented | Upload, local validation, visibility changes, public approval/revocation, signed URL refresh, attach/detach, and delete events are recorded. |
| Public portfolio privacy | Implemented | `/u/[slug]` never returns audit events, private notes, private file internals, or signed URL internals. |
| Frontend history UI | Implemented | `/portfolio-generator` shows a proof file activity panel and per-file audit history with safe summaries only. |
| Retention controls | Implemented | Retention review, delete request, delete completion, detach request, and metadata export events are recorded without file contents. |
| Binary archive export | Implemented | Owner-only archive request, preparation, download-link, expiration, and deletion events are recorded with safe summaries only. |
| Expired archive cleanup | Implemented | Server/admin cleanup records safe archive expiration, deletion, or failure events without archive keys, paths, signed tokens, or file contents. |

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
- `retention_reviewed`
- `delete_requested`
- `delete_completed`
- `detach_requested`
- `export_requested`
- `export_generated_metadata`
- `binary_export_requested`
- `binary_export_prepared`
- `binary_export_failed`
- `binary_export_download_link_generated`
- `binary_export_expired`
- `binary_export_deleted`

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
- Retention status or review status changed.
- Delete was requested or completed.
- A metadata-only export summary was requested and generated.
- A binary proof-file archive was requested, prepared, failed, expired, revoked, or had a short-lived owner download link generated.
- Expired generated archive cleanup selected, removed, or safely failed against an owner archive request.

## What Is Never Logged

- File contents.
- Resume text, screenshot contents, or PDF text.
- Absolute local paths.
- Private S3/R2 bucket URLs.
- Raw storage keys in public output.
- Full signed URLs, query tokens, signatures, or private bucket URLs.
- Archive storage keys, archive signed URL secrets, or generated archive contents.
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

## Retention And Export Safety

Retention controls are documented in [Proof File Retention Controls](proof-file-retention-controls.md).

- `scheduled_for_delete`, `deleted`, and `retained_for_audit` files stay out of public portfolios.
- Metadata export events record that an export summary was requested/generated, not the exported file contents.
- Binary archive export events record workflow status only. They never store generated archive contents, archive storage paths, private bucket URLs, or signed archive URL tokens.
- Expired archive cleanup events use `actor: system` and record status only. They never store archive keys, local paths, bucket URLs, signed URL secrets, source proof file contents, or lifecycle provider internals.
- Audit summaries never include private storage paths, bucket URLs, signed URL tokens, scanner payloads, or proof-file contents.

## Verification Checklist

- Upload creates `uploaded` and `local_validated` events.
- Visibility change creates `visibility_changed` plus `public_approved` or `public_revoked`.
- Signed URL refresh creates `signed_url_generated` with no token or storage URL.
- Delete/detach creates `detached_from_project` and `deleted` events.
- Retention review creates `retention_reviewed`.
- Delete request creates `delete_requested`; confirmed delete creates `delete_completed`.
- Metadata export creates `export_requested` and `export_generated_metadata`.
- Binary archive export creates safe `binary_export_*` events without archive paths or tokens.
- Expired archive cleanup creates safe `binary_export_expired`, `binary_export_deleted`, or `binary_export_failed` events without deleting source proof files.
- Audit list requires ownership.
- Public portfolio responses do not include audit events.
- Audit records do not expose local paths, private bucket URLs, raw storage keys, signed tokens, or file contents.
