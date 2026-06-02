import cron from "node-cron";
import { syncAdzunaJobs } from "../services/job-providers/adzuna.provider.js";

export function initJobSyncCron() {
  console.info("Initializing job synchronization cron job...");
  
  // Runs every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.info("Running scheduled Adzuna job synchronization...");
    try {
      await syncAdzunaJobs("developer", "in", 15);
    } catch (err: any) {
      console.error("Cron job synchronization failed:", err.message);
    }
  });

  // Trigger a background check/initial sync on startup after a small delay
  setTimeout(async () => {
    console.info("Running startup background Adzuna job synchronization...");
    try {
      await syncAdzunaJobs("developer", "in", 10);
    } catch (err: any) {
      console.error("Startup background synchronization failed:", err.message);
    }
  }, 10000);
}
