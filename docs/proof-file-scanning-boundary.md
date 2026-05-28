# Proof File Scanning Provider-Ready Boundary

Last updated: 2026-05-28

This phase adds an honest scanning boundary for uploaded portfolio proof files. It does not claim malware scanning is Live unless a real provider is configured and a real scan succeeds. Local validation remains active by default.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Local validation | Implemented | Checks MIME type, extension, 5MB size limit, executable signatures, and file magic numbers. |
| Scan metadata | Implemented | Portfolio file records now store scan status, provider, timestamp, summary, blocked reason, and public eligibility. |
| Provider scanner | Provider-ready | Env placeholders exist, but no provider is Live without credentials and verified scan success. |
| Public portfolio filtering | Implemented | `/u/[slug]` excludes private, blocked, failed, pending, and not-scanned files. |
| Builder scan UX | Implemented | `/portfolio-generator` shows scan status badges and explains local validation versus provider malware scanning. |
| Audit trail | Implemented | Upload, scan, visibility, signed URL, attach/detach, and delete events are recorded with safe summaries only. |

## Provider Status Rules

- `Live`: only when `FILE_SCANNING_PROVIDER`, `FILE_SCANNING_API_KEY`, and `FILE_SCANNING_ENDPOINT` are configured and a real provider scan returns a verified clean result.
- `Provider-ready`: env placeholders or credentials exist, but a real verified scan has not been completed.
- `Local validation`: MIME, extension, size, executable signature, and magic-number checks are active, but malware scanning is not configured.
- `Not configured`: no scanning boundary exists. This should not be the normal app state because local validation is implemented.

Required backend placeholders:

```env
FILE_SCANNING_PROVIDER=
FILE_SCANNING_API_KEY=
FILE_SCANNING_ENDPOINT=
FILE_SCANNING_TIMEOUT_MS=10000
```

Never commit real scanner credentials or API tokens.

## Scan Metadata

Portfolio proof file metadata can include:

- `scanStatus`: `not_scanned`, `local_validated`, `provider_pending`, `clean`, `blocked`, or `failed`
- `scanProvider`
- `scannedAt`
- `scanSummary`
- `blockedReason`
- `isPublicEligible`

The public endpoint never exposes absolute local paths, private bucket URLs, storage keys, credentials, or private owner notes.

## Upload Flow

When a proof file is uploaded:

1. The app runs local validation first.
2. If scanner credentials are missing, the file is marked `local_validated`.
3. If scanner credentials exist, the scanning abstraction calls the configured provider.
4. Provider errors return `failed`; the upload flow does not crash, but the file remains private.
5. A provider result is never converted to `clean` unless the provider explicitly returns a clean result.

Local validation is useful upload hardening, but it is not malware scanning.

## Public Eligibility Rules

- Files default to `private`.
- `blocked`, `failed`, `provider_pending`, and `not_scanned` files cannot be marked public-approved.
- `publicApproved` files appear publicly only when `isPublicEligible` is true.
- Local validation can make a file eligible for owner-approved public sharing, but the UI labels it as local validation, not provider clean.
- Restoring portfolio versions does not bypass the public eligibility filter.

## Frontend Behavior

`/portfolio-generator` shows:

- Scan status badge.
- Local validation versus provider scan explanation.
- "Provider scanning not configured" when no scanner is configured.
- Disabled public approval for blocked, failed, pending, or not-scanned files.
- Warning: "Local validation checks file type and signatures. Provider malware scanning requires setup."

`/u/[slug]` shows:

- Only public-approved and public-eligible file links.
- Safe unavailable text when a link is absent or expired.
- No private file metadata or blocked/failed file names.

## Audit Trail Boundary

Proof file scanning events now feed the owner-scoped [Proof File Audit Trail](proof-file-audit-trail.md).

- `local_validated` is recorded by the system after local validation.
- Provider scan changes use `scan_status_changed` and never imply `clean` without a provider result.
- Audit records do not include file contents, absolute local paths, storage keys, private bucket URLs, signed URL tokens, or provider credentials.
- Public portfolios never expose audit events or scan internals.

## Testing Checklist

- Upload defaults to `local_validated` when scanner credentials are missing.
- No fake `clean` scan appears without a provider result.
- Blocked scan metadata prevents `publicApproved`.
- Failed scan metadata is excluded from the public portfolio response.
- Public portfolio hides blocked/failed files even if old data says `publicApproved`.
- Frontend scan badges render and do not claim scanning Live.

## No Fake Scanning Policy

Do not claim:

- Malware scanning is Live without a configured provider and verified clean scan.
- Local validation means a file is malware-free.
- Blocked or failed files are safe.
- S3/R2, custom hosting, or scanner providers are Live before real credentials and verification.
