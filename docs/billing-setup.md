# Billing Setup

Billing is currently mock/provider-ready. No real payment is created.

## Implemented

- Shared plan catalog for Free, Pro, Premium, and Admin.
- Mock billing summary endpoint.
- Mock checkout endpoint.
- Billing settings UI.
- Usage summary based on AI request events.

## Required For Stripe

- Stripe account.
- Product and price IDs for Pro and Premium.
- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.
- Checkout session route.
- Webhook route for subscription lifecycle events.
- Customer ID persistence.
- Plan enforcement middleware.

## Safety Rules

- Do not hardcode Stripe keys.
- Do not claim paid billing is live until a real checkout and webhook flow is tested.
- Keep Free plan available for demos.
- Show clear cancellation and refund policies after legal review.
