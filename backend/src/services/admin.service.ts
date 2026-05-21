import { createRecord, deleteRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { ensureSampleJobs } from "./job.service.js";
import { normalizeJobSourceJob } from "./job-source.service.js";
import { listAuditLogs } from "./audit-log.service.js";
import { getRiskSignals, getSystemHealth } from "./system-health.service.js";

export async function listUsers() {
  return findRecords("users", {}, { sort: { createdAt: -1 } });
}

export async function listAdminJobs() {
  await ensureSampleJobs();
  return findRecords("jobs", {}, { sort: { postedAt: -1 } });
}

export async function createAdminJob(input: any) {
  return createRecord("jobs", normalizeJobSourceJob({ ...input, source: input.source || "Admin manual import" }));
}

export async function updateAdminJob(id: string, input: any) {
  const existing = await findRecordById("jobs", id);
  return updateRecord("jobs", id, normalizeJobSourceJob({ ...(existing || {}), ...input }));
}

export async function deleteAdminJob(id: string) {
  return deleteRecord("jobs", id);
}

export async function aiUsage() {
  return findRecords("aiRequests", {}, { sort: { createdAt: -1 }, limit: 100 });
}

export async function auditLogs() {
  return listAuditLogs(100);
}

export async function systemHealth() {
  return getSystemHealth();
}

export async function riskSignals() {
  return getRiskSignals();
}

export async function usageAnalytics() {
  const [aiRequests, usageEvents, subscriptions] = await Promise.all([
    findRecords("aiRequests", {}, { sort: { createdAt: -1 }, limit: 100 }),
    findRecords("usageEvents", {}, { sort: { createdAt: -1 }, limit: 100 }),
    findRecords("subscriptions", {}, { sort: { createdAt: -1 }, limit: 100 })
  ]);
  return {
    aiRequests,
    usageEvents,
    subscriptions,
    totals: {
      aiRequests: aiRequests.length,
      usageEvents: usageEvents.length,
      activeSubscriptions: subscriptions.filter((subscription: any) => subscription.status === "active").length
    }
  };
}

export async function reports() {
  return findRecords("jobScamReports", {}, { sort: { createdAt: -1 }, limit: 100 });
}

export async function feedback() {
  return findRecords("feedback", {}, { sort: { createdAt: -1 }, limit: 100 });
}
