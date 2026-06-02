import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, findRecords, updateRecord } from "../utils/repository.js";
import { writeAuditLog } from "./audit-log.service.js";

const maintenanceJobTypes = new Set(["proof_archive_cleanup"]);
const maintenanceStatuses = new Set(["started", "completed", "failed", "partial"]);
const maintenanceTriggers = new Set(["admin", "system", "manual"]);

function safeMaintenanceText(value: any, maxLength = 500) {
  return String(value || "")
    .replace(/[A-Za-z]:\\[^\s]+/g, "[local-path-redacted]")
    .replace(/https?:\/\/[^\s?]+(\?[^\s]*)?/g, "[url-redacted]")
    .replace(/portfolio-proof-exports\/[^\s"']+/g, "[archive-key-redacted]")
    .replace(/(token|signature|sig|accessKey|secretKey)=([^\s&"']+)/gi, "$1=[redacted]")
    .replace(/archiveStorageKey/gi, "[archive-key-redacted]")
    .trim()
    .slice(0, maxLength);
}

function normalizeJobType(value: any) {
  return maintenanceJobTypes.has(value) ? value : "proof_archive_cleanup";
}

function normalizeStatus(value: any) {
  return maintenanceStatuses.has(value) ? value : "started";
}

function normalizeTriggeredBy(value: any) {
  return maintenanceTriggers.has(value) ? value : "manual";
}

function count(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function durationMs(startedAt: any, completedAt = new Date()) {
  const start = startedAt ? new Date(startedAt).getTime() : Date.now();
  return Math.max(0, completedAt.getTime() - start);
}

export function presentMaintenanceRun(record: any) {
  return {
    runId: String(record.runId || ""),
    jobType: normalizeJobType(record.jobType),
    triggeredBy: normalizeTriggeredBy(record.triggeredBy),
    status: normalizeStatus(record.status),
    startedAt: record.startedAt || "",
    completedAt: record.completedAt || "",
    durationMs: count(record.durationMs),
    scannedCount: count(record.scannedCount),
    expiredCount: count(record.expiredCount),
    deletedCount: count(record.deletedCount),
    skippedCount: count(record.skippedCount),
    failedCount: count(record.failedCount),
    safeSummary: safeMaintenanceText(record.safeSummary, 500),
    failureReason: safeMaintenanceText(record.failureReason, 240),
    createdAt: record.createdAt || "",
    updatedAt: record.updatedAt || ""
  };
}

export async function startMaintenanceRun(input: {
  jobType?: string;
  triggeredBy?: string;
  actorUserId?: string;
  actorRole?: string;
  safeSummary?: string;
} = {}) {
  const run = await createRecord("maintenanceRuns", {
    runId: randomUUID(),
    jobType: normalizeJobType(input.jobType),
    triggeredBy: normalizeTriggeredBy(input.triggeredBy),
    status: "started",
    startedAt: new Date().toISOString(),
    safeSummary: safeMaintenanceText(input.safeSummary || "Maintenance run started.")
  });

  await writeAuditLog({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: "archive_cleanup_run_started",
    category: "admin",
    method: "SYSTEM",
    path: "/api/admin/maintenance/proof-archives/cleanup",
    statusCode: 202,
    riskLevel: "low",
    metadata: {
      runId: String(run.runId),
      jobType: normalizeJobType(run.jobType),
      triggeredBy: normalizeTriggeredBy(run.triggeredBy),
      safeSummary: "Archive cleanup run started without archive keys, paths, signed URL tokens, or file contents."
    }
  });

  return run;
}

export async function completeMaintenanceRun(run: any, result: any) {
  const completedAt = new Date();
  const failedCount = count(result?.failedCount);
  const status = failedCount > 0 ? "partial" : "completed";
  const updated = await updateRecord("maintenanceRuns", String(run._id), {
    status,
    completedAt: completedAt.toISOString(),
    durationMs: durationMs(run.startedAt, completedAt),
    scannedCount: count(result?.scannedCount),
    expiredCount: count(result?.expiredMarkedCount ?? result?.expiredCount),
    deletedCount: count(result?.deletedArtifactCount ?? result?.deletedCount),
    skippedCount: count(result?.skippedCount),
    failedCount,
    failureReason: failedCount > 0 ? safeMaintenanceText(result?.failureReason || "One or more archive artifacts could not be cleaned.", 240) : "",
    safeSummary: safeMaintenanceText(
      status === "partial"
        ? "Archive cleanup completed with one or more safe failures. Original proof files were not touched."
        : "Archive cleanup completed. Generated archive artifacts only were targeted.",
      500
    )
  });

  await writeAuditLog({
    action: status === "partial" ? "archive_cleanup_run_failed" : "archive_cleanup_run_completed",
    category: "admin",
    method: "SYSTEM",
    path: "/api/admin/maintenance/proof-archives/cleanup",
    statusCode: status === "partial" ? 207 : 200,
    riskLevel: status === "partial" ? "medium" : "low",
    metadata: {
      runId: String(run.runId),
      jobType: normalizeJobType(run.jobType),
      status,
      scannedCount: count(result?.scannedCount),
      expiredCount: count(result?.expiredMarkedCount ?? result?.expiredCount),
      deletedCount: count(result?.deletedArtifactCount ?? result?.deletedCount),
      skippedCount: count(result?.skippedCount),
      failedCount,
      safeSummary: "Archive cleanup run recorded counts only. No archive keys, paths, signed tokens, or file contents were logged."
    }
  });

  return updated;
}

export async function failMaintenanceRun(run: any, error: any) {
  const completedAt = new Date();
  const failureReason = safeMaintenanceText(error?.message || "Maintenance run failed.", 240);
  const updated = await updateRecord("maintenanceRuns", String(run._id), {
    status: "failed",
    completedAt: completedAt.toISOString(),
    durationMs: durationMs(run.startedAt, completedAt),
    failureReason,
    safeSummary: "Archive cleanup run failed safely. No archive keys, paths, signed URL tokens, or file contents were stored."
  });

  await writeAuditLog({
    action: "archive_cleanup_run_failed",
    category: "admin",
    method: "SYSTEM",
    path: "/api/admin/maintenance/proof-archives/cleanup",
    statusCode: 500,
    riskLevel: "medium",
    metadata: {
      runId: String(run.runId),
      jobType: normalizeJobType(run.jobType),
      status: "failed",
      failureReason,
      safeSummary: "Archive cleanup run failed without logging archive keys, paths, signed URL tokens, or file contents."
    }
  });

  return updated;
}

export async function listMaintenanceRuns(input: any = {}) {
  const limit = Math.min(Math.max(count(input.limit) || 25, 1), 100);
  const filter: Record<string, any> = {};
  if (input.jobType) filter.jobType = normalizeJobType(input.jobType);
  const runs = await findRecords("maintenanceRuns", filter, { sort: { startedAt: -1 }, limit });
  return {
    items: runs.map(presentMaintenanceRun),
    total: runs.length,
    warning: "Maintenance history is admin-only and stores counts plus safe summaries only."
  };
}

export async function getMaintenanceRun(runId: string) {
  const run = await findOneRecord("maintenanceRuns", { runId });
  if (!run) throw new ApiError(404, "Maintenance run not found");
  return presentMaintenanceRun(run);
}
