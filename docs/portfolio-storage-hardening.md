# Portfolio Storage Hardening

Last updated: 2026-05-28

This phase hardens the portfolio file boundary for resume PDFs, portfolio PDFs, screenshots, generated portfolio assets, and project proof files. It adds private metadata and signed URL readiness without claiming S3/R2 is live.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Private portfolio file metadata | Implemented | Owner-scoped metadata is stored separately from public portfolio projection. |
| Storage key sanitization | Implemented | Absolute local paths, bucket URLs, empty path segments, and traversal keys are rejected. |
| Signed download/view URL readiness | Implemented | S3/R2 uses presigned URLs when configured; local fallback returns safe app upload routes. |
| Default signed URL TTL | Implemented | Defaults to `900` seconds through `STORAGE_SIGNED_URL_TTL_SECONDS`. |
| User-initiated proof file upload UX | Implemented | Owners can upload PNG, JPG, WEBP, and PDF proof files up to 5MB. |
| Public portfolio file filtering | Implemented | `/u/[slug]` receives only `publicApproved` file metadata and links. |
| Real S3/R2 bucket activation | Provider-ready | Requires credentials, bucket policy, and manual verification before marking Live. |
| Custom hosted portfolio domains | Provider-ready only | No Vercel domain provisioning is implemented. |

## Metadata Schema

Portfolio-related file metadata uses the following safe fields:

- `fileId`
- `ownerId`
- `portfolioId`
- `projectId`
- `proofMappingId`
- `fileType`: `resumePdf`, `portfolioPdf`, `screenshot`, `proofFile`, or `other`
- `storageProvider`: `local`, `s3`, or `r2`
- `storageKey`
- `originalFilename`
- `mimeType`
- `size`
- `visibility`: `private` or `publicApproved`
- `createdAt`
- `updatedAt`

The frontend must never receive absolute local disk paths, private bucket URLs, access keys, secret keys, or raw provider credentials.

## API Behavior

Protected owner endpoints:

```text
GET /api/portfolios/storage/status
GET /api/portfolios/:id/files
POST /api/portfolios/:id/files/metadata
POST /api/portfolios/:id/files/upload
PATCH /api/portfolios/:id/files/:fileId
GET /api/portfolios/:id/files/:fileId/signed-url
POST /api/portfolios/:id/files/:fileId/attach
DELETE /api/portfolios/:id/files/:fileId
```

Upload rules:

- Form field is `proofFile`.
- Allowed MIME types are `image/png`, `image/jpeg`, `image/webp`, and `application/pdf`.
- Maximum file size is 5MB.
- Extension and magic-number/signature validation must both pass.
- Uploaded files are stored as private metadata by default.
- Owners can attach files to a project case study or skill proof mapping through `projectId` or `proofMappingId`.

Public portfolio endpoint:

```text
GET /api/portfolios/public/:slug
```

Public behavior:

- Private files are excluded.
- `publicApproved` files can be returned with short-lived signed download/view links.
- Expired or unavailable file links should be shown as unavailable, not broken.
- Public file links do not imply third-party proof verification.
- Public file payloads must not include absolute local paths, private bucket URLs, raw provider credentials, or internal storage keys.

## Signed URL Rules

- `STORAGE_SIGNED_URL_TTL_SECONDS=900` is the default.
- S3/R2 signed URLs are provider-ready and short-lived.
- Local fallback returns `/uploads/...` routes only for existing app-supported local files.
- Local fallback is not durable production storage and should not be described as private cloud hosting.

## Privacy Rules

- New portfolio file metadata defaults to `private`.
- Public portfolios only show file links after the owner marks them `publicApproved`.
- Email, phone, private notes, and unpublished portfolio data remain hidden unless explicitly enabled by existing visibility controls.
- Restoring a portfolio version must not publish private files accidentally; the public projection still filters file visibility.
- Delete/detach removes the stored object through the storage abstraction and removes portfolio proof references.

## Required Environment Placeholders

```env
STORAGE_PROVIDER=local
STORAGE_BUCKET_NAME=
STORAGE_REGION=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_SIGNED_URL_TTL_SECONDS=900
```

Do not commit real credentials. Configure real values only in Render/Vercel/provider dashboards.

## Manual S3/R2 Setup Steps

1. Create a private S3 bucket or Cloudflare R2 bucket.
2. Create a least-privilege access key for object put/get/delete on the portfolio storage prefix.
3. Add the storage env vars to the backend hosting provider.
4. Redeploy the backend.
5. Upload a non-private test file through an approved app flow.
6. Verify generated signed URLs expire as configured.
7. Confirm `/status` and `/api/portfolios/storage/status` show provider-ready or verified-live status honestly.
8. Only mark storage as Live after credentials, bucket access, and signed download behavior are tested.

## What Not To Claim

- Do not claim S3/R2 is Live while `STORAGE_PROVIDER=local`.
- Do not claim permanent public hosting for local upload URLs.
- Do not expose proof files on `/u/[slug]` unless visibility is `publicApproved`.
- Do not publish screenshots, resumes, generated PDFs, or proof files without explicit user action.
