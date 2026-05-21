import type { PlanConfig } from "@ai-job-copilot/shared";
import { env } from "../config/env.js";

export function getBillingProviderStatus() {
  const provider = env.BILLING_PROVIDER === "stripe" && env.STRIPE_SECRET_KEY ? "stripe" : "mock";
  return {
    provider,
    configured: provider === "stripe",
    mockOnly: provider === "mock",
    requiredForStripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_PRO", "STRIPE_PRICE_PREMIUM"]
  };
}

export async function createBillingCheckoutSession(userId: string, plan: PlanConfig) {
  const status = getBillingProviderStatus();
  if (status.provider !== "stripe") {
    return {
      provider: "mock",
      userId,
      plan,
      checkoutUrl: "",
      mode: "subscription",
      note: "Mock checkout only. No payment was created."
    };
  }

  return {
    provider: "stripe-ready",
    userId,
    plan,
    checkoutUrl: "",
    mode: "subscription",
    note: "Stripe secret is configured, but live checkout creation is intentionally disabled until Stripe SDK and webhook verification are added."
  };
}
