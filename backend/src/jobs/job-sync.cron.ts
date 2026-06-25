import cron from "node-cron";
import { runFullAdzunaSync } from "../services/job-providers/adzuna.provider.js";
import { syncRemotiveJobs } from "../services/job-providers/remotive.provider.js";
import { syncArbeitnowJobs } from "../services/job-providers/arbeitnow.provider.js";

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

async function runAllSyncs() {
  let totalCount = 0;
  try {
    console.info("Starting Adzuna sync...");
    const adzunaRes = await runFullAdzunaSync();
    totalCount += adzunaRes.totalSynced || 0;
  } catch (err: any) {
    console.error("Adzuna sync failed:", err.message);
  }

  try {
    console.info("Starting Remotive sync...");
    const remotiveRes = await syncRemotiveJobs(50);
    totalCount += remotiveRes.syncedCount || 0;
  } catch (err: any) {
    console.error("Remotive sync failed:", err.message);
  }

  try {
    console.info("Starting Arbeitnow sync...");
    const arbeitnowRes = await syncArbeitnowJobs();
    totalCount += arbeitnowRes.syncedCount || 0;
  } catch (err: any) {
    console.error("Arbeitnow sync failed:", err.message);
  }

  return { totalSynced: totalCount };
}

export function initJobSyncCron() {
  console.info("Initializing job synchronization cron job...");
  
  // Runs every 6 hours (0 */6 * * *)
  cron.schedule("0 */6 * * *", async () => {
    console.info("Running scheduled job synchronization for all sources...");
    try {
      await runAllSyncs();
      await performCleanupsAndBackfill();
    } catch (err: any) {
      console.error("Cron job synchronization failed:", err.message);
    }
  });

  // Trigger a background check/initial sync on startup after a small delay
  setTimeout(async () => {
    console.info("Running startup background job synchronization for all sources...");
    try {
      await runAllSyncs();
      await performCleanupsAndBackfill();
    } catch (err: any) {
      console.error("Startup background synchronization failed:", err.message);
    }
  }, 10000);
}
