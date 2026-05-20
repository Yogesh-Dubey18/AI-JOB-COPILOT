import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureSampleJobs } from "./services/job.service.js";

await connectDB();
await ensureSampleJobs();

app.listen(env.PORT, () => {
  console.log("AI Job Copilot API running on port " + env.PORT);
});
