# SaaS Billing v2

AI Job Copilot v2 adds a billing-ready architecture without activating real payments by default. The local app uses mock subscriptions and usage events so demos stay safe and no user is charged.

## What Exists

- Shared Free, Pro, Premium, and Admin plan catalog in `shared/plans.ts`.
- Subscription persistence with mock activation.
- Usage event persistence for AI credits.
- AI credit limit checks before AI features run.
- Billing summary, plans, usage, checkout, subscription, and mock activation routes.
- Stripe-ready environment placeholders.

## Routes

- `GET /api/billing/plans`
- `GET /api/billing/summary`
- `GET /api/billing/subscription`
- `GET /api/billing/usage`
- `POST /api/billing/checkout`
- `POST /api/billing/mock/activate`

## Usage Limits

AI features consume credits based on approximate prompt and output token size. Free users start with 50 monthly AI credits. When credits are exhausted, AI routes return `402` with the current plan, remaining credits, and the next recommended plan.

## Mock Billing Rules

- Mock checkout never creates payment.
- Mock activation can switch the local subscription plan for testing.
- UI copy must not imply a real subscription or charge.
- Real Stripe checkout remains disabled until SDK, price IDs, webhook verification, and legal review are completed.

## Environment Variables

- `BILLING_PROVIDER=mock`
- `STRIPE_SECRET_KEY=`
- `STRIPE_WEBHOOK_SECRET=`
- `STRIPE_PRICE_PRO=`
- `STRIPE_PRICE_PREMIUM=`

Keep these placeholders empty in committed examples.
