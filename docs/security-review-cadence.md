# Security Review Cadence

## Every Commit

- Run git safety check.
- Confirm no `.env` files are staged.
- Confirm no keys, credentials, PDFs, build outputs, or uploads are staged.

## Weekly

- Review auth, CORS, rate limit, and validation changes.
- Review new dependencies.
- Review docs for overclaims or fake live URLs.

## Before Deployment

- Verify environment variables in platform dashboards.
- Confirm frontend has only public API URL.
- Confirm backend secrets are server-only.
- Confirm MongoDB Atlas network access is intended.
- Confirm no real user data in demo fixtures.

## After Incident

- Preserve logs safely.
- Rotate affected secrets if exposure is possible.
- Add regression test or safety script.
- Update troubleshooting docs.
