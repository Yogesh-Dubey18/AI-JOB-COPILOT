# Portfolio Proof File Upload UX

Last updated: 2026-05-28

This phase adds user-initiated proof file uploads to the portfolio builder while keeping every file private by default. It uses the private portfolio file metadata and signed URL boundary introduced in the storage hardening phase.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Protected upload endpoint | Implemented | Owners can upload proof files for their own portfolio only. |
| Attach to case study or proof mapping | Implemented | Files can be attached to a project case study or skill proof mapping. |
| List current proof files | Implemented | Owner-scoped list includes signed/local download readiness metadata. |
| Visibility updates | Implemented | Owners can switch between `private` and `publicApproved`. |
| Signed URL refresh | Implemented | Owners can request a fresh short-lived download/view URL. |
| Delete/detach | Implemented | Deletes the stored object through the storage abstraction and detaches portfolio references. |
| Public route filtering | Implemented | `/u/[slug]` only shows `publicApproved` files. |
| S3/R2 storage | Provider-ready | Requires real credentials and signed URL verification before marking Live. |

## Supported Files

Allowed MIME types:

- `image/png`
- `image/jpeg`
- `image/webp`
- `application/pdf`

Allowed size:

- Maximum 5MB per file.

Validation:

- MIME type allowlist.
- Extension allowlist.
- Magic-number/signature validation for PNG, JPEG, WEBP, and PDF.
- Executable signatures such as `MZ` and ELF are rejected.

## API Behavior

Protected owner endpoints:

```text
POST /api/portfolios/:id/files/upload
GET /api/portfolios/:id/files
PATCH /api/portfolios/:id/files/:fileId
GET /api/portfolios/:id/files/:fileId/signed-url
POST /api/portfolios/:id/files/:fileId/attach
DELETE /api/portfolios/:id/files/:fileId
```

Upload form field:

```text
proofFile
```

Optional upload fields:

- `projectId`
- `proofMappingId`
- `visibility`
- `fileType`

Default visibility is `private` even when the request does not include a visibility value.

## Frontend Behavior

The `/portfolio-generator` page now shows:

- Proof file upload section.
- Allowed file type and size guidance.
- Private-by-default badge.
- Storage status badge.
- Project/case-study attachment selector.
- Visibility selector for `private` or `publicApproved`.
- Signed URL/download action.
- Delete/detach action.
- Warning: "Private proof files are only shared publicly when you approve them."

The public `/u/[slug]` page:

- Shows only public-approved proof files.
- Hides private files completely.
- Avoids private local disk paths, private bucket URLs, raw storage keys, and owner-only notes.
- Shows safe unavailable text if a public-approved file has no usable download link.

## Proof Honesty

Uploaded files are owner-maintained proof, not third-party verification.

Do not claim:

- Fake project proof.
- Fake GitHub stats.
- Fake testimonials.
- Fake metrics.
- Fake provider verification.

The UI keeps proof labels honest and uses the existing warning:

```text
Do not claim skills, results, or metrics that you cannot explain or prove.
```

## Storage Provider Honesty

Local fallback:

- Works through the app storage abstraction.
- Returns app-served `/uploads/...` links when supported.
- Is not production-durable.
- Must not be described as private cloud storage or permanent hosting.

S3/R2:

- Remains provider-ready until real credentials are configured.
- Must generate and verify signed URLs before being marked Live.
- Should use private buckets and least-privilege object access.

Required placeholders:

```env
STORAGE_PROVIDER=local
STORAGE_BUCKET_NAME=
STORAGE_REGION=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_SIGNED_URL_TTL_SECONDS=900
```

Do not commit real storage credentials or uploaded proof assets.

## Verification Coverage

Backend coverage includes:

- Unsupported file type rejection.
- Oversized file rejection.
- Private metadata default.
- Owner-gated signed URL route.
- Public portfolio exclusion for private files.
- Public portfolio inclusion for `publicApproved` files only.
- No absolute local path, private bucket URL, or raw storage key in public output.

Frontend coverage includes:

- Upload section rendering.
- File type and size guidance.
- Private-by-default warning.
- Visibility toggle.
- Storage status badge.
- Public portfolio hiding private files.
- No fake S3/R2 Live claim.
