import { DEFAULT_PLAN_ID, PLAN_CATALOG, type PlanId } from "@ai-job-copilot/shared";
import { createRecord, findRecords } from "../utils/repository.js";

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export async function recordUsageEvent(userId: string | undefined, feature: string, units = 1, source = "api", metadata: Record<string, any> = {}) {
  if (!userId) return null;
  return createRecord("usageEvents", {
    userId,
    feature,
    metric: "ai_credit",
    units,
    source,
    period: currentPeriod(),
    status: "recorded",
    metadata
  });
}

/**
 * Strip the underlying AI provider/model from records returned to end users.
 * Credit totals are computed before this and are unaffected; admins read the raw records.
 */
function toUserFacingAiRequest(item: any) {
  if (!item || typeof item !== "object") return item;
  const { provider: _provider, model: _model, error: _error, ...rest } = item;
  return { ...rest, engine: "AI Job Copilot", mode: item.fallbackUsed ? "fallback" : "ai" };
}

function toUserFacingUsageEvent(item: any) {
  if (!item || typeof item !== "object" || !item.metadata || typeof item.metadata !== "object") return item;
  const { provider: _provider, model: _model, ...metadata } = item.metadata;
  return { ...item, metadata };
}

export async function getUsageSummary(userId: string, planId: PlanId = DEFAULT_PLAN_ID) {
  const usage = await findRecords("usageEvents", { userId }, { sort: { createdAt: -1 } });
  const aiRequests = await findRecords("aiRequests", { userId }, { sort: { createdAt: -1 } });
  const plan = PLAN_CATALOG[planId] || PLAN_CATALOG.free;
  const meteredCredits = usage.reduce((sum: number, item: any) => sum + Math.max(1, Number(item.units || 1)), 0);
  const requestCredits = aiRequests.reduce((sum: number, item: any) => {
    const tokens = Number(item.inputTokens || 0) + Number(item.outputTokens || 0);
    return sum + Math.max(1, Math.ceil(tokens / 1000));
  }, 0);
  const usedCredits = meteredCredits || requestCredits;
  const fallbackEvents = aiRequests.filter((item: any) => item.fallbackUsed || item.status === "mock" || item.status === "fallback").length;
  return {
    plan,
    usedCredits,
    remainingCredits: Math.max(0, plan.aiCreditsPerMonth - usedCredits),
    totalEvents: aiRequests.length,
    usageEventCount: usage.length,
    fallbackEvents,
    usageEvents: usage.slice(0, 20).map(toUserFacingUsageEvent),
    events: aiRequests.slice(0, 20).map(toUserFacingAiRequest)
  };
}
