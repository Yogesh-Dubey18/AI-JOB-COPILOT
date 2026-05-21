import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env, validateRuntimeEnv } from "./config/env.js";
import { ensureSampleJobs } from "./services/job.service.js";

const envCheck = validateRuntimeEnv();
for (const warning of envCheck.warnings) console.warn("Environment warning: " + warning);
if (!envCheck.ok) {
  throw new Error("Invalid production environment: " + envCheck.failures.join(" "));
}

await connectDB();
await ensureSampleJobs();

app.listen(env.PORT, () => {
  console.log("AI Job Copilot API running on port " + env.PORT);
});
