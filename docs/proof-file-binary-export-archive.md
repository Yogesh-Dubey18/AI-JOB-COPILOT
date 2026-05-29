# Proof File Binary Export Archive

Last updated: 2026-05-29

This phase adds an owner-only binary archive workflow for portfolio proof files. It requires explicit owner confirmation, filters unsafe files before archive generation, creates short-lived archive access, and keeps public portfolio routes free of export metadata.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Export request model | Implemented | Owner-scoped export request records track status, requested files, included/excluded counts, provider, expiry, safe summary, and failure reason. |
| Confirmation flow | Implemented | Owners review selected files, eligibility, scan status, retention status, and visibility before confirming archive generation. |
| Archive generation | Implemented | Eligible proof files are packaged server-side into a ZIP archive with a safe `manifest.json`. No generated archives are committed to the repo. |
| Signed archive URL | Implemented | Owners can request a short-lived archive download link. Default TTL is 900 seconds. |
| Local fallback | Implemented with limitation | Local archive storage works through the app storage abstraction, but is labeled not production-durable. |
| S3/R2 archive storage | Provider-ready | Uses the same private storage abstraction when credentials are configured. Do not mark Live until real bucket access and signed URL behavior are tested. |
| Public portfolio privacy | Implemented | `/u/[slug]` never exposes export requests, archive links, archive metadata, audit events, retention internals, or private file metadata. |
| Audit integration | Implemented | Safe binary export events are recorded without file contents, archive storage paths, signed URL secrets, or private bucket URLs. |

## Export Request Metadata

Export request records include:

- `exportId`
- `ownerId`
- `portfolioId`
- `status`: `requested`, `preparing`, `ready`, `failed`, `expired`, or `deleted`
- `requestedFileIds`
- `includedFileCount`
- `excludedFileCount`
- `archiveStorageKey` for internal storage only
- `archiveProvider`: `local`, `s3`, or `r2`
- `archiveFilename`
- `expiresAt`
- `createdAt`
- `updatedAt`
- `failureReason`
- `safeSummary`

API responses never include `archiveStorageKey`, private bucket URLs, absolute local paths, provider credentials, file contents, or signed URL secrets.

## Owner Confirmation Flow

Protected owner endpoints:

```text
POST /api/portfolios/:id/files/export-archive/preview
POST /api/portfolios/:id/files/export-archive
GET /api/portfolios/:id/files/export-archive
GET /api/portfolios/:id/files/export-archive/:exportId
GET /api/portfolios/:id/files/export-archive/:exportId/signed-url
DELETE /api/portfolios/:id/files/export-archive/:exportId
```

The preview endpoint returns:

- selected proof files
- visibility
- scan status
- retention status
- review status
- eligibility
- exclusion reason when a file is not eligible
- storage status label
- signed URL TTL

The create endpoint requires:

```json
{
  "requestedFileIds": ["file-id"],
  "confirmExport": true
}
```

Without explicit confirmation, the backend returns a validation error and does not generate an archive.

## Eligibility Rules

Files are excluded from archive generation when they are:

- deleted
- scheduled for delete
- retained for audit
- blocked by scanning
- failed scanning
- provider-pending
- not scanned
- marked non-public-eligible by the scanning boundary
- missing a safe storage key
- owned by another user
- outside the selected portfolio

The current implementation exports only scan-eligible active proof files. This is stricter than a generic data export because the archive is designed for owner-reviewed portfolio proof sharing, not bulk account data portability.

## Archive Contents

The archive contains:

- `manifest.json`
- included proof file binaries under `proof-files/`

The manifest includes safe metadata only:

- export id
- portfolio id
- generated timestamp
- privacy note
- storage status label
- included file summaries
- excluded file summaries and reasons

The manifest does not include:

- signed URL secrets
- private bucket URLs
- absolute local disk paths
- provider credentials
- file contents copied into JSON
- private audit notes

## Signed Archive URL Behavior

- Owner authentication and portfolio ownership are required.
- Archive status must be `ready`.
- Expired archives return an expiration error and are marked `expired` by metadata.
- Signed URL TTL uses `STORAGE_SIGNED_URL_TTL_SECONDS`; default is 900 seconds.
- Local fallback returns an app-served `/uploads/...` link and is labeled non-durable.
- S3/R2 returns provider signed URLs only after the provider is configured through the storage abstraction.

The app never stores or logs the full signed archive URL.

## Frontend UX

`/portfolio-generator` now includes:

- "Export Proof Files Archive" section
- file selection checklist
- eligibility explanation
- explicit owner-only confirmation action
- archive request status
- included/excluded counts
- storage provider and local fallback labels
- expiry information
- download button only after a short-lived link is generated
- failure and expired status display
- privacy warning: "Binary export is owner-only. Public portfolios never expose private archive links."

## Public Portfolio Restrictions

`/u/[slug]` must never expose:

- export request records
- archive download links
- archive storage keys
- archive metadata
- audit event history
- retention internals
- private proof file metadata
- private notes

Public portfolios continue to show only public-approved, scan-eligible, active proof files.

## Audit Events

Binary archive workflow records:

- `binary_export_requested`
- `binary_export_prepared`
- `binary_export_failed`
- `binary_export_download_link_generated`
- `binary_export_expired`
- `binary_export_deleted`

Audit summaries must never include:

- archive signed URL secrets
- archive storage paths
- private bucket URLs
- file contents
- provider credentials

## Cleanup And Expiry Plan

Current cleanup behavior:

- archive metadata expires automatically by `expiresAt`
- signed URL generation refuses expired archives
- owners can delete/revoke an archive request, which deletes the archive object through the storage abstraction when available

Production hardening follow-up:

- background cleanup job for expired local/S3/R2 archive objects
- provider lifecycle policies for `portfolio-proof-exports/`
- admin-safe cleanup monitoring without exposing archive contents

## Verification Checklist

- Export request requires portfolio ownership.
- Preview shows selected files and eligibility before archive generation.
- Deleted, scheduled, retained-for-audit, blocked, failed, pending, and noneligible files are excluded.
- Archive response does not expose storage keys, absolute local paths, private bucket URLs, or signed token secrets.
- Signed archive URL route requires the owner.
- Public portfolio response does not include export request data.
- Audit events are created with safe summaries only.
- Local fallback is labeled not production-durable.
- S3/R2 remains provider-ready until real credentials and signed URL tests pass.

## Safety Policy

Do not claim:

- archive storage is durable when running in local fallback
- S3/R2 archive hosting is Live before real credentials and verification
- binary export is public-shareable
- archive links are permanent
- scanner/storage providers succeeded without real evidence
