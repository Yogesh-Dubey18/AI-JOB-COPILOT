import { DEFAULT_PLAN_ID, PLAN_CATALOG, type PlanId } from "@ai-job-copilot/shared";
import { createBillingCheckoutSession, getBillingProviderStatus } from "./billing-provider.service.js";
import { activateMockSubscription, getOrCreateSubscription, normalizePlanId } from "./subscription.service.js";
import { getUsageSummary } from "./usage.service.js";

export async function getBillingPlans() {
  return {
    plans: Object.values(PLAN_CATALOG).filter((plan) => plan.id !== "admin"),
    provider: getBillingProviderStatus(),
    note: "Plans are billing-ready. Real charging requires Stripe setup and legal review."
  };
}

export async function getBillingSummary(userId: string, planId: PlanId = DEFAULT_PLAN_ID) {
  const subscription = await getOrCreateSubscription(userId);
  const activePlanId = normalizePlanId(subscription.planId || planId);
  const usage = await getUsageSummary(userId, activePlanId);
  return {
    provider: getBillingProviderStatus(),
    subscriptionStatus: subscription.status || "active",
    subscription,
    currentPlan: usage.plan,
    usage,
    invoices: [],
    note: "Billing is mock/provider-ready. Configure Stripe and webhooks before charging users."
  };
}

export async function createMockCheckoutSession(userId: string, planId: PlanId) {
  const plan = PLAN_CATALOG[normalizePlanId(planId)] || PLAN_CATALOG.free;
  return createBillingCheckoutSession(userId, plan);
}

export async function activateMockPlan(userId: string, planId: string) {
  const subscription = await activateMockSubscription(userId, planId);
  const usage = await getUsageSummary(userId, normalizePlanId(subscription.planId));
  return {
    provider: "mock",
    subscription,
    currentPlan: usage.plan,
    usage,
    note: "Mock plan activated locally. No payment was created."
  };
}
