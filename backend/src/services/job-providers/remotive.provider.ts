import axios from "axios";
import { createManualJob } from "../job.service.js";
import { enrichJobFields } from "../job-normalizer.js";

export async function syncRemotiveJobs(limit = 50) {
  try {
    const url = `https://remotive.com/api/remote-jobs?limit=${limit}`;
    const response = await axios.get(url);
    const results = response.data?.jobs || [];
    let syncedCount = 0;
    
    for (const rawJob of results) {
      const fields = enrichJobFields({
        title: rawJob.title,
        description: rawJob.description,
        tags: [...(Array.isArray(rawJob.tags) ? rawJob.tags : []), rawJob.category],
        jobTypeHint: rawJob.job_type,
        remoteHint: true,
        salaryText: rawJob.salary,
        defaultCurrency: "USD"
      });
      const companyName = String(rawJob.company_name || "Hiring Company").trim();
      const locationName = String(rawJob.candidate_required_location || "Remote").trim();
      const applyUrl = String(rawJob.url || "").trim();

      const postedAt = rawJob.publication_date ? new Date(rawJob.publication_date) : new Date();
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
        externalId: String(rawJob.id || ""),
        source: "Remotive",
        sourceType: "api-provider",
        postedAt,
        expiresAt
      };

      const syncResult = await createManualJob(jobData);
      if (!syncResult.duplicate) {
        syncedCount++;
      }
    }

    console.info(`Remotive sync completed: successfully imported ${syncedCount} new jobs.`);
    return { syncedCount, message: "Sync successful" };
  } catch (error: any) {
    console.error("Remotive API sync error:", error.message);
    return { syncedCount: 0, error: error.message };
  }
}
