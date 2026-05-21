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
  const usedCredits = usage.reduce((sum: number, item: any) => {
    const tokens = Number(item.inputTokens || 0) + Number(item.outputTokens || 0);
    return sum + Math.max(1, Math.ceil(tokens / 1000));
  }, 0);
  const fallbackEvents = usage.filter((item: any) => item.fallbackUsed || item.status === "mock" || item.status === "fallback").length;
  return {
    plan,
    usedCredits,
    remainingCredits: Math.max(0, plan.aiCreditsPerMonth - usedCredits),
    totalEvents: usage.length,
    fallbackEvents,
    events: usage.slice(-20)
  };
}
