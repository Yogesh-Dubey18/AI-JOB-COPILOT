# Stripe Integration Plan

This project is Stripe-ready but does not include live charging. Follow this plan before enabling paid subscriptions.

## Required Setup

1. Create Stripe products for Pro and Premium.
2. Create monthly recurring prices.
3. Store price IDs in deployment environment variables.
4. Add the Stripe SDK on the backend.
5. Create checkout sessions server-side only.
6. Add a signed webhook route for subscription lifecycle events.
7. Map Stripe customers and subscriptions to local `Subscription` records.
8. Test with Stripe test mode before production.

## Required Environment Values

- `BILLING_PROVIDER=stripe`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_PREMIUM`

Never expose Stripe secret keys in the frontend.

## Webhook Events To Handle

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Go-Live Conditions

- Test checkout works end to end.
- Webhook signatures are verified.
- Plan changes update app limits correctly.
- Refund, cancellation, privacy, and support policies are reviewed by a qualified professional.
- Pricing page clearly explains what is paid and what remains AI/provider-dependent.

## Current Limitation

The current implementation returns mock checkout payloads and supports mock plan activation only. This is intentional for local demos and portfolio safety.
