import { PLAN_CATALOG } from "@ai-job-copilot/shared";
import { getOrCreateSubscription, normalizePlanId } from "./subscription.service.js";
import { getUsageSummary } from "./usage.service.js";

export async function checkAiCreditLimit(userId: string, feature: string, requestedCredits = 1) {
  const subscription = await getOrCreateSubscription(userId);
  const planId = normalizePlanId(subscription.planId);
  const usage = await getUsageSummary(userId, planId);
  const allowed = usage.remainingCredits >= requestedCredits || planId === "admin";
  const nextPlan = planId === "free" ? PLAN_CATALOG.pro : planId === "pro" ? PLAN_CATALOG.premium : null;
  return {
    allowed,
    feature,
    requestedCredits,
    plan: usage.plan,
    usedCredits: usage.usedCredits,
    remainingCredits: usage.remainingCredits,
    nextPlan,
    reason: allowed ? "" : "AI credit limit reached for the current billing period."
  };
}
