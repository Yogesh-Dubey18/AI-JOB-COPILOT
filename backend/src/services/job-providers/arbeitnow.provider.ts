import axios from "axios";
import { createManualJob } from "../job.service.js";
import { enrichJobFields } from "../job-normalizer.js";

export async function syncArbeitnowJobs() {
  try {
    const url = "https://www.arbeitnow.com/api/job-board-api";
    const response = await axios.get(url);
    const results = response.data?.data || [];
    let syncedCount = 0;
    
    for (const rawJob of results) {
      const fields = enrichJobFields({
        title: rawJob.title,
        description: rawJob.description,
        tags: Array.isArray(rawJob.tags) ? rawJob.tags : [],
        jobTypeHint: rawJob.job_types,
        remoteHint: rawJob.remote === true ? true : undefined,
        defaultCurrency: "EUR"
      });
      const companyName = String(rawJob.company_name || "Hiring Company").trim();
      const locationName = String(rawJob.location || "Global").trim();
      const applyUrl = String(rawJob.url || "").trim();

      const postedAt = rawJob.created_at ? new Date(rawJob.created_at * 1000) : new Date();
      const expiresAt = new Date(postedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

      const jobData = {
        title: fields.title || "Untitled role",
        company: companyName,
        location: locationName,
        remoteType: fields.remoteType,
        jobType: fields.jobType,
        experienceRequired: fields.experienceRequired,
        salaryMin: fields.salaryMin,
        salaryMax: fields.salaryMax,
        currency: fields.currency,
        description: fields.description,
        responsibilities: [],
        requirements: [],
        skillsRequired: fields.skillsRequired,
        applyUrl,
        externalId: String(rawJob.slug || ""),
        source: "Arbeitnow",
        sourceType: "api-provider",
        postedAt,
        expiresAt
      };

      const syncResult = await createManualJob(jobData);
      if (!syncResult.duplicate) {
        syncedCount++;
      }
    }

    console.info(`Arbeitnow sync completed: successfully imported ${syncedCount} new jobs.`);
    return { syncedCount, message: "Sync successful" };
  } catch (error: any) {
    console.error("Arbeitnow API sync error:", error.message);
    return { syncedCount: 0, error: error.message };
  }
}
