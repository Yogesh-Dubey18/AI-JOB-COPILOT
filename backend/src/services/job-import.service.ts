import { ensureSampleJobs } from "./job.service.js";
import { curatedJobSources } from "./job-source.service.js";

export async function importLatestJobs() {
  await ensureSampleJobs();
  return { imported: 9, source: curatedJobSources[0].id, mode: "safe-manual-or-curated-import" };
}
