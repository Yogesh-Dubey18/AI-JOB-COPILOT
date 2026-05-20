# Public Demo Notes

No public live URLs are configured yet.

## Current URL Status

- Frontend live URL: pending.
- Backend live URL: pending.
- Backend health URL: pending.

## Demo Honesty

- AI provider integration is ready but uses mock fallback unless backend AI keys are configured.
- Billing is mock/Stripe-ready and does not charge users.
- Email sending is mock unless SMTP values are configured.
- Job data uses seed/manual-safe architecture and does not scrape protected job boards.
- Resume tailoring and messages are generated for user review only.

## Before Sharing Publicly

- Deploy backend.
- Verify `/health`.
- Deploy frontend.
- Configure `NEXT_PUBLIC_API_URL`.
- Configure backend `CLIENT_URL`.
- Run production smoke test.
- Update docs only with verified real URLs.
