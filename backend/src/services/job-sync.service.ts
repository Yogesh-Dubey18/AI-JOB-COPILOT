import { createRecord, findRecords } from "../utils/repository.js";

export const JOB_SYNC_SOURCES = ["adzuna", "remotive", "arbeitnow"] as const;
export type JobSyncSource = (typeof JOB_SYNC_SOURCES)[number] | (string & {});
export type JobSyncTrigger = "cron" | "startup" | "admin";

type ProviderResult = { syncedCount?: number; totalSynced?: number; message?: string; error?: string } | void;

/**
 * Runs one provider sync and records the outcome (counts, duration, error) so admins can see
 * what happened and restarts do not trigger needless re-syncs. Never throws.
 */
export async function runTrackedSync(source: JobSyncSource, triggeredBy: JobSyncTrigger, run: () => Promise<ProviderResult>) {
  const startedAt = new Date();
  let status: "completed" | "failed" | "skipped" = "completed";
  let importedCount = 0;
  let message = "";
  let error = "";
  try {
    const result = (await run()) || {};
    importedCount = Number(result.syncedCount ?? result.totalSynced ?? 0) || 0;
    message = String(result.message || "");
    if (result.error) {
      status = "failed";
      error = String(result.error).slice(0, 300);
    } else if (/not configured|skipped/i.test(message)) {
      status = "skipped";
    }
  } catch (err: any) {
    status = "failed";
    error = String(err?.message || err).slice(0, 300);
  }
  const completedAt = new Date();
  try {
    return await createRecord("jobSyncRuns", {
      source,
      status,
      triggeredBy,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      importedCount,
      message,
      error
    });
  } catch {
    return { source, status, importedCount, error };
  }
}

export async function listJobSyncRuns(limit = 30) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  return findRecords("jobSyncRuns", {}, { sort: { startedAt: -1 }, limit: safeLimit });
}

/** Latest run per source plus the last successful one. */
export async function getJobSyncStatus() {
  const runs = await findRecords("jobSyncRuns", {}, { sort: { startedAt: -1 }, limit: 200 });
  const sources = Array.from(new Set([...JOB_SYNC_SOURCES, ...runs.map((run: any) => run.source)]));
  return sources.map((source) => {
    const mine = runs.filter((run: any) => run.source === source);
    const last = mine[0] || null;
    const lastSuccess = mine.find((run: any) => run.status === "completed") || null;
    return {
      source,
      lastRunAt: last?.startedAt || null,
      lastStatus: last?.status || "never_run",
      lastError: last?.error || "",
      lastImportedCount: last?.importedCount ?? 0,
      lastSuccessAt: lastSuccess?.completedAt || null
    };
  });
}

/** True when every source has a successful or skipped run newer than maxAgeHours. */
export async function isSyncFresh(maxAgeHours = 5, now = Date.now()) {
  const runs = await findRecords("jobSyncRuns", {}, { sort: { startedAt: -1 }, limit: 100 });
  const cutoff = now - maxAgeHours * 60 * 60 * 1000;
  return JOB_SYNC_SOURCES.every((source) =>
    runs.some((run: any) => run.source === source && run.status !== "failed" && new Date(run.startedAt).getTime() >= cutoff)
  );
}
