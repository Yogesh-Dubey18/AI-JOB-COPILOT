import cron from "node-cron";
import { runFullAdzunaSync } from "../services/job-providers/adzuna.provider.js";

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

export function initJobSyncCron() {
  console.info("Initializing job synchronization cron job...");
  
  // Runs every 6 hours (0 */6 * * *)
  cron.schedule("0 */6 * * *", async () => {
    console.info("Running scheduled Adzuna job synchronization...");
    try {
      await runFullAdzunaSync();
      await performCleanupsAndBackfill();
    } catch (err: any) {
      console.error("Cron job synchronization failed:", err.message);
    }
  });

  // Trigger a background check/initial sync on startup after a small delay
  setTimeout(async () => {
    console.info("Running startup background Adzuna job synchronization...");
    try {
      await runFullAdzunaSync();
      await performCleanupsAndBackfill();
    } catch (err: any) {
      console.error("Startup background synchronization failed:", err.message);
    }
  }, 10000);
}
