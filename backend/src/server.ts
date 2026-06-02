import "./services/monitoring.service.js";
import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env, validateRuntimeEnv } from "./config/env.js";
import { ensureSampleJobs } from "./services/job.service.js";
import { initJobSyncCron } from "./jobs/job-sync.cron.js";

const envCheck = validateRuntimeEnv();
for (const warning of envCheck.warnings) console.warn("Environment warning: " + warning);
if (!envCheck.ok) {
  throw new Error("Invalid production environment: " + envCheck.failures.join(" "));
}

await connectDB();
await ensureSampleJobs();
initJobSyncCron();

app.listen(env.PORT, () => {
  console.log("AI Job Copilot API running on port " + env.PORT);
});
