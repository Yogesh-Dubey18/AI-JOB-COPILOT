import { ensureSampleJobs } from "./job.service.js";

export async function importLatestJobs() {
  await ensureSampleJobs();
  return { imported: 9, source: "sample-seed-fallback" };
}
