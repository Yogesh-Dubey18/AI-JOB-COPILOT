import cron from "node-cron";
import { runFullAdzunaSync } from "../services/job-providers/adzuna.provider.js";
import { syncRemotiveJobs } from "../services/job-providers/remotive.provider.js";
import { syncArbeitnowJobs } from "../services/job-providers/arbeitnow.provider.js";
import { isSyncFresh, runTrackedSync, type JobSyncTrigger } from "../services/job-sync.service.js";

async function performCleanupsAndBackfill() {
  try {
    const { cleanupExpiredJobs, cleanupDuplicates, runJobExpirationBackfill } = await import("../services/job.service.js");
    await runJobExpirationBackfill();
    await cleanupDuplicates();
    await cleanupExpiredJobs();
  } catch (err: any) {
    console.error("Scheduled cleanup or backfill failed:", err.message);
  }
}

async function runAllSyncs(triggeredBy: JobSyncTrigger) {
  const results = [
    await runTrackedSync("adzuna", triggeredBy, () => runFullAdzunaSync()),
    await runTrackedSync("remotive", triggeredBy, () => syncRemotiveJobs(50)),
    await runTrackedSync("arbeitnow", triggeredBy, () => syncArbeitnowJobs())
  ];
  for (const run of results) {
    if (run.status === "failed") console.error(`${run.source} sync failed: ${run.error}`);
  }
  return { totalSynced: results.reduce((sum, run) => sum + (run.importedCount || 0), 0) };
}

export function initJobSyncCron() {
  console.info("Initializing job synchronization cron job...");
  
  // Runs every 6 hours (0 */6 * * *)
  cron.schedule("0 */6 * * *", async () => {
    console.info("Running scheduled job synchronization for all sources...");
    try {
      await runAllSyncs("cron");
      await performCleanupsAndBackfill();
    } catch (err: any) {
      console.error("Cron job synchronization failed:", err.message);
    }
  });

  // Trigger a background check/initial sync on startup after a small delay
  setTimeout(async () => {
    try {
      if (await isSyncFresh(5)) {
        console.info("Skipping startup job sync: every source synced successfully in the last 5 hours.");
        return;
      }
      console.info("Running startup background job synchronization for all sources...");
      await runAllSyncs("startup");
      await performCleanupsAndBackfill();
    } catch (err: any) {
      console.error("Startup background synchronization failed:", err.message);
    }
  }, 10000);
}
