import { DEFAULT_PLAN_ID, PLAN_CATALOG, type PlanId } from "@ai-job-copilot/shared";
import { createRecord, findRecords } from "../utils/repository.js";

export async function recordUsageEvent(userId: string | undefined, feature: string, units = 1) {
  return createRecord("aiRequests", {
    userId,
    feature,
    model: "usage-meter",
    inputTokens: units,
    outputTokens: 0,
    status: "tracked",
    error: ""
  });
}

export async function getUsageSummary(userId: string, planId: PlanId = DEFAULT_PLAN_ID) {
  const usage = await findRecords("aiRequests", { userId });
  const plan = PLAN_CATALOG[planId] || PLAN_CATALOG.free;
  const usedCredits = usage.reduce((sum: number, item: any) => sum + Number(item.inputTokens || 1), 0);
  return {
    plan,
    usedCredits,
    remainingCredits: Math.max(0, plan.aiCreditsPerMonth - usedCredits),
    events: usage.slice(-20)
  };
}
