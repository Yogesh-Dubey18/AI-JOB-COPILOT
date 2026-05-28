# Proof File Retention Controls

Last updated: 2026-05-28

This phase adds owner-controlled retention, detach/delete review, and metadata export review for portfolio proof files. It does not export file contents, expose private storage paths, or make retained files public.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Retention metadata | Implemented | Portfolio proof files now track retention status, retention reason, delete request/completion dates, last review date, review status, and safe owner note. |
| Detach review | Implemented | Owners can detach a file from a project case study or proof mapping without deleting the stored object. |
| Delete review | Implemented | Owners must confirm deletion. Delete request and delete completion are audited before metadata is removed. |
| Metadata export summary | Implemented | Owners can generate a safe proof-file metadata and recent audit activity summary. Binary export is not implemented. |
| Public portfolio filtering | Implemented | `/u/[slug]` hides deleted, scheduled-for-delete, retained-for-audit, private, and scan-ineligible proof files. |
| Audit integration | Implemented | Retention review, delete request, delete completion, detach request, and export events are recorded with safe summaries only. |

## Retention Metadata

Portfolio proof file metadata can include:

- `retentionStatus`: `active`, `scheduled_for_delete`, `deleted`, or `retained_for_audit`
- `retentionReason`
- `deleteRequestedAt`
- `deleteCompletedAt`
- `lastReviewedAt`
- `reviewStatus`: `not_reviewed`, `reviewed`, or `needs_attention`
- `ownerNote`

`ownerNote` and `retentionReason` are sanitized before being returned to the owner UI. They must never contain file contents, absolute local paths, private bucket URLs, signed URL secrets, or provider credentials.

## Retention Status Rules

- `active`: file can remain attached and may be public-approved only if visibility and scan eligibility also allow it.
- `scheduled_for_delete`: file is hidden from public output and visibility is forced back to `private`.
- `deleted`: file metadata/storage object deletion has been completed or requested through the safe delete flow.
- `retained_for_audit`: file is kept only for owner/account review context and is never public.

Only `active` files can appear publicly, and only when they are also `publicApproved` and scan-eligible.

## Detach vs Delete

Detach:

- Removes the file from the project case study or proof mapping.
- Keeps owner-scoped file metadata.
- Keeps the stored object when the storage provider still has it.
- Records `detach_requested` and `detached_from_project` audit events.

Delete:

- Requires explicit owner confirmation.
- Revokes public visibility.
- Records `delete_requested`.
- Deletes the storage object through the storage abstraction when safe.
- Removes owner file metadata after deletion.
- Preserves minimal audit records with safe summaries only.
- Records `delete_completed` and the legacy `deleted` event.

The UI explains this difference before owners use the actions.

## Owner Export Summary

Protected route:

```text
GET /api/portfolios/:id/files/export-summary
```

The export summary includes:

- portfolio id
- generated timestamp
- proof file ids
- file type
- original filename
- MIME type
- size
- visibility
- scan status
- public eligibility
- retention status
- review status
- attached project/proof mapping ids
- recent safe audit event summaries

The export summary never includes:

- file contents
- binary downloads
- signed URL tokens
- full signed URLs
- private bucket URLs
- absolute local paths
- provider credentials
- raw scanner payloads
- private file text or screenshot contents

Current binary export status:

```text
metadata_export_ready
```

Binary proof-file export requires a future secure archive workflow with owner confirmation, short-lived links, and storage-provider safeguards.

## Audit Event Types

Retention controls add these owner-scoped events:

- `retention_reviewed`
- `delete_requested`
- `delete_completed`
- `detach_requested`
- `export_requested`
- `export_generated_metadata`

Existing upload, validation, scan, visibility, signed URL, attach, detach, and delete events continue to work.

## Frontend Behavior

`/portfolio-generator` now shows:

- retention status badge
- review status badge
- detach action
- delete request action
- confirmed delete action
- metadata export summary action
- privacy explanation: "Export shows your proof-file metadata and audit history. It does not expose private storage paths or signed URL secrets."

Public portfolios never show retention metadata, audit events, owner notes, file internals, signed URL internals, or private proof details.

## Verification Checklist

- Retention fields default to `active` and `not_reviewed`.
- Detach creates safe audit events and keeps the owner file record.
- Delete request creates a safe audit event and hides the file publicly.
- Confirmed delete removes file metadata and preserves minimal audit history.
- Export summary requires portfolio ownership.
- Export summary contains no signed tokens, absolute paths, private bucket URLs, storage keys, or file contents.
- Public portfolio hides `scheduled_for_delete`, `deleted`, and `retained_for_audit` files.

## Safety Policy

Do not claim:

- Binary data export exists until secure archive export is implemented.
- Retained audit metadata contains file contents.
- Deleted files remain downloadable.
- Local fallback storage is production durable.
- Scanner or storage providers are Live until credentials and real verification succeed.
