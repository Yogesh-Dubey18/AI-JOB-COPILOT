import { DEFAULT_PLAN_ID, PLAN_CATALOG, type PlanId } from "@ai-job-copilot/shared";
import { getUsageSummary } from "./usage.service.js";

export async function getBillingSummary(userId: string, planId: PlanId = DEFAULT_PLAN_ID) {
  const usage = await getUsageSummary(userId, planId);
  return {
    provider: "mock-stripe-ready",
    subscriptionStatus: "demo",
    currentPlan: usage.plan,
    usage,
    invoices: [],
    note: "Billing is mock/provider-ready. Configure Stripe and webhooks before charging users."
  };
}

export async function createMockCheckoutSession(userId: string, planId: PlanId) {
  const plan = PLAN_CATALOG[planId] || PLAN_CATALOG.free;
  return {
    provider: "mock-stripe-ready",
    userId,
    plan,
    checkoutUrl: "",
    note: "Stripe checkout is not configured. No payment was created."
  };
}
