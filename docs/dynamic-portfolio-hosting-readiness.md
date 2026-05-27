# Dynamic Portfolio Hosting Readiness

Last updated: 2026-05-27

This document explains the hosting boundary for public portfolio slugs. The current implementation supports app-level portfolio URLs. Custom-domain hosting remains provider-ready only.

## Current Hosting Status

| Capability | Status | Notes |
|---|---|---|
| `/u/[slug]` app route | Implemented | Public route renders published, privacy-filtered portfolios. |
| Missing/private slug handling | Implemented | The page shows a safe unavailable state. |
| Public SEO metadata | Implemented | Metadata is generated only from the public endpoint. |
| Portfolio PDF export | Implemented | Uses existing PDF export service and respects visibility settings. |
| S3/R2 private file storage | Provider-ready | Required for durable private resume/PDF hosting. |
| Custom domain hosting | Provider-ready only | No Vercel domain provisioning is implemented. |
| User custom subdomain | Not configured | Requires product, DNS, provider, and abuse-prevention design. |

## Custom Domain Boundary

The current app creates URLs like:

```text
https://ai-job-copilot-frontend.vercel.app/u/example-slug
```

It does not create or claim URLs like:

```text
example.aijobcopilot.com
candidate-custom-domain.com
```

Those require manual provider setup, DNS ownership checks, abuse controls, and a domain provisioning workflow.

## Future Provider Inputs

The following environment placeholders may be useful only if custom-domain automation is implemented later:

```env
VERCEL_TOKEN=
VERCEL_TEAM_ID=
PORTFOLIO_BASE_DOMAIN=
```

They are not required by the current runtime and should not be treated as active provider integration until code, provider credentials, DNS validation, and verification tests exist.

## S3/R2 Dependency

Local uploads are not durable production storage. Before enabling real public resume downloads at scale:

- Configure S3 or Cloudflare R2.
- Store resumes and generated PDFs in a private bucket.
- Serve downloads through short-lived signed URLs.
- Add deletion flows for unpublished portfolios and account deletion.
- Add audit logs for publish/unpublish and resume download visibility changes.

## Safe Launch Language

Allowed:

- "Public portfolio slugs are available in the app."
- "Custom-domain hosting is provider-ready."
- "S3/R2 private storage is required before production file hosting."

Not allowed:

- "Permanent portfolio hosting is live" unless storage and domain providers are configured.
- "Custom domains are live" until verified.
- "Hosted portfolio domain provisioned" without real provider evidence.
