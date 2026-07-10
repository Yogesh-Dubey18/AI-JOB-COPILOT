import type { PlanConfig } from "@ai-job-copilot/shared";
import { env } from "../config/env.js";
import Stripe from "stripe";
import { findOneRecord } from "../utils/repository.js";

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

  const user = await findOneRecord("users", { _id: userId });
  const userEmail = user?.email;

  let priceId = "";
  if (plan.id === "pro") {
    priceId = env.STRIPE_PRICE_PRO;
  } else if (plan.id === "premium") {
    priceId = env.STRIPE_PRICE_PREMIUM;
  }

  if (!priceId) {
    throw new Error(`Stripe Price ID for plan '${plan.id}' is not configured on the backend env variables.`);
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as any
  });

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: "subscription",
    success_url: `${env.CLIENT_URL}/dashboard?billing=success`,
    cancel_url: `${env.CLIENT_URL}/settings/billing?billing=cancel`,
    metadata: {
      userId,
      planId: plan.id
    }
  });

  return {
    provider: "stripe",
    userId,
    plan,
    checkoutUrl: session.url || "",
    mode: "subscription",
    sessionId: session.id
  };
}
