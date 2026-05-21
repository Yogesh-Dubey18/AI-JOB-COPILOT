import { isDbReady } from "../config/db.js";
import { getAiRuntime } from "../ai/aiClient.js";
import { getBillingProviderStatus } from "./billing-provider.service.js";
import { countRecords, findRecords } from "../utils/repository.js";
import { getProviderStatus } from "./provider-status.service.js";

export async function getSystemHealth() {
  const ai = getAiRuntime();
  const [users, jobs, applications, aiRequests, auditLogs] = await Promise.all([
    countRecords("users"),
    countRecords("jobs"),
    countRecords("applications"),
    countRecords("aiRequests"),
    countRecords("auditLogs")
  ]);
  return {
    status: "ok",
    database: { connected: isDbReady(), mode: isDbReady() ? "mongodb" : "memory-fallback" },
    ai: { provider: ai.provider, model: ai.model, timeoutMs: ai.timeoutMs, retryAttempts: ai.retryAttempts },
    billing: getBillingProviderStatus(),
    providers: getProviderStatus(),
    counts: { users, jobs, applications, aiRequests, auditLogs },
    checkedAt: new Date().toISOString()
  };
}

export async function getRiskSignals() {
  const [jobs, aiRequests, auditLogs, scamReports] = await Promise.all([
    findRecords("jobs", {}, { limit: 500 }),
    findRecords("aiRequests", {}, { limit: 500 }),
    findRecords("auditLogs", {}, { limit: 500 }),
    findRecords("jobScamReports", {}, { limit: 500 })
  ]);
  const highRiskJobs = jobs.filter((job: any) => Number(job.scamRiskScore || 0) >= 70 || Number(job.trustScore || 100) < 50);
  const fallbackEvents = aiRequests.filter((event: any) => event.fallbackUsed || event.status === "mock" || event.status === "fallback");
  const deniedAdminEvents = auditLogs.filter((event: any) => event.action === "admin.denied");
  return {
    highRiskJobs: highRiskJobs.length,
    aiFallbackRate: aiRequests.length ? Math.round((fallbackEvents.length / aiRequests.length) * 100) : 0,
    deniedAdminEvents: deniedAdminEvents.length,
    scamReports: scamReports.length,
    signals: [
      highRiskJobs.length ? "Review high-risk job records before recommending them." : "No high-risk job spike detected.",
      fallbackEvents.length ? "AI fallback/mock usage is active; verify provider configuration before claiming live AI." : "AI provider fallback rate is low.",
      deniedAdminEvents.length ? "Admin access denials exist; review audit logs for unusual access." : "No admin denial spike detected."
    ]
  };
}
