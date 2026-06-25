import axios from "axios";
import { createManualJob } from "../job.service.js";

export async function syncArbeitnowJobs() {
  try {
    const url = "https://www.arbeitnow.com/api/job-board-api";
    const response = await axios.get(url);
    const results = response.data?.data || [];
    let syncedCount = 0;
    
    for (const rawJob of results) {
      const cleanTitle = String(rawJob.title || "").replace(/<\/?[^>]+(>|$)/g, "").trim();
      const companyName = String(rawJob.company_name || "Hiring Company").trim();
      const locationName = String(rawJob.location || "Global").trim();
      const applyUrl = String(rawJob.url || "").trim();
      const description = String(rawJob.description || "").replace(/<\/?[?#]*[^>]+(>|$)/g, "").trim();

      const skillsRequired = Array.isArray(rawJob.tags) ? rawJob.tags : [];
      const devSkills = ["react", "node", "typescript", "javascript", "mongodb", "python", "sql", "java"];
      for (const skill of devSkills) {
        if (description.toLowerCase().includes(skill)) {
          skillsRequired.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
      }

      const postedAt = rawJob.created_at ? new Date(rawJob.created_at * 1000) : new Date();
      const expiresAt = new Date(postedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

      const jobData = {
        title: cleanTitle || "Software Engineer",
        company: companyName,
        location: locationName,
        remoteType: rawJob.remote ? "Remote" : "Onsite",
        jobType: Array.isArray(rawJob.job_types) && rawJob.job_types.length > 0 ? rawJob.job_types[0] : "Full-time",
        experienceRequired: "0-2 years",
        salaryMin: undefined,
        salaryMax: undefined,
        currency: "EUR",
        description: description,
        responsibilities: [
          "Participate in the software design and development life cycle",
          "Ensure application code is modular and clean",
          "Collaborate with multi-functional product squads"
        ],
        requirements: [
          "Hands-on project development expertise",
          "Good debugging and structural reasoning skills"
        ],
        skillsRequired: Array.from(new Set(skillsRequired)),
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
