# Private Storage Readiness

## Current implementation

- Resume uploads accept PDF, DOCX, and TXT with a 5 MiB limit, MIME allow-list, and content-signature checks. The authenticated resume router enforces user authorization; temporary Multer files are removed on success and failure.
- Resume, version, generated PDF, proof-file, and proof-archive links use `GET /api/storage/download`. A short-lived HMAC binds the normalized key, owner ID, and expiry. The endpoint checks the current owning record and permission before reading any object.
- Storage keys reject absolute paths, URL origins, null bytes, empty segments, and `.`/`..` traversal. Downloads are attachments with `private, no-store` and `nosniff` headers. Request/audit logging records query names, not query values.
- S3 and R2 objects are fetched server-side; the browser does not receive provider credentials or origin URLs. Incomplete selected S3/R2 settings fail closed rather than silently falling back to local storage.
- New Cloudinary raw uploads request `authenticated` delivery. Downloads inspect the resource delivery type and use Cloudinary's private download URL for private/authenticated resources. Existing Cloudinary resources are not modified.

## Production configuration

Configure values only in the backend deployment environment:

```text
NODE_ENV=production
STORAGE_PROVIDER=s3
STORAGE_BUCKET_NAME=
STORAGE_REGION=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_SIGNING_SECRET=<at least 32 randomly generated characters>
STORAGE_SIGNED_URL_TTL_SECONDS=900
```

For Cloudflare R2, set `STORAGE_PROVIDER=r2` and `STORAGE_ENDPOINT` to the account's S3-compatible endpoint. Use credentials restricted to the application's bucket and required object operations. `STORAGE_SIGNING_SECRET` is required in production regardless of provider; it is never sent to the frontend. Development may use the configured JWT access secret as a local fallback only.

Bucket policy must block public access and provider-side encryption must be enabled. The application cannot verify these account-level settings from credentials alone. The code has not been run against live S3/R2 credentials in this environment.

## Cloudinary legacy assets

Cloudinary's default `upload` delivery type is public. The application does not assume existing files are private. New uploads request `authenticated`; old resources retain their existing delivery settings. A Cloudinary account owner must inventory the actual delivery type and access mode. Do not change access settings or migrate/delete assets until an owner-approved migration has a backup, object-to-record mapping, verification plan, rollback procedure, and deletion confirmation. Existing public URLs could remain accessible directly at Cloudinary until then.

## Authorization and URL behavior

The signed link is a short-lived bearer capability, not an interactive login session. Every request verifies the HMAC and then looks up the record bound to the link's owner. Record deletion, proof revocation, retention changes, or archive expiry stops access even before the URL expires. Public proof links are issued only for active, public-approved, eligible files with an allowed clean/local-validation scan state.

An owner-specific link must not be placed in analytics, logs, public HTML, or long-lived caches. Links are not revocable individually before their TTL unless their owning record/permission is removed or the signing secret is rotated.

## Verification performed

Regression coverage exercises valid and expired signatures, tampering, owner mismatch, unregistered and missing objects, path handling, invalid file types/size, absent signing secret, provider configuration validation, and the removed static `/uploads` route. Provider integration and Cloudinary account permissions remain pending external configuration and review.
