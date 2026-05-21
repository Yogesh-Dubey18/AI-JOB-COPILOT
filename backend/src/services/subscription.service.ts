import { DEFAULT_PLAN_ID, PLAN_CATALOG, type PlanId } from "@ai-job-copilot/shared";
import { createRecord, findOneRecord, updateRecord } from "../utils/repository.js";

function monthlyPeriod() {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { currentPeriodStart: start, currentPeriodEnd: end };
}

function isPlanId(value: string): value is PlanId {
  return value in PLAN_CATALOG;
}

export function normalizePlanId(value: string | undefined): PlanId {
  return value && isPlanId(value) ? value : DEFAULT_PLAN_ID;
}

export async function getOrCreateSubscription(userId: string) {
  const existing = await findOneRecord("subscriptions", { userId, status: { $ne: "canceled" } });
  if (existing) {
    return { ...existing, plan: PLAN_CATALOG[normalizePlanId(existing.planId)] };
  }
  const subscription = await createRecord("subscriptions", {
    userId,
    planId: DEFAULT_PLAN_ID,
    status: "active",
    provider: "mock",
    ...monthlyPeriod()
  });
  return { ...subscription, plan: PLAN_CATALOG.free };
}

export async function activateMockSubscription(userId: string, planIdInput: string) {
  const planId = normalizePlanId(planIdInput);
  const existing = await getOrCreateSubscription(userId);
  const updated = await updateRecord("subscriptions", String(existing._id), {
    planId,
    status: "active",
    provider: "mock",
    cancelAtPeriodEnd: false,
    metadata: { activatedBy: "mock_checkout" },
    ...monthlyPeriod()
  });
  return { ...updated, plan: PLAN_CATALOG[planId] };
}
