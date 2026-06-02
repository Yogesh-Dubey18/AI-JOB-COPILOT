import axios from "axios";
import { env } from "../../config/env.js";
import { createManualJob } from "../job.service.js";

export async function syncAdzunaJobs(what = "developer", country = "in", resultsLimit = 10) {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
    console.info("Adzuna API credentials missing. Sync skipped.");
    return { syncedCount: 0, message: "Adzuna credentials not configured" };
  }

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;
    const response = await axios.get(url, {
      params: {
        app_id: env.ADZUNA_APP_ID,
        app_key: env.ADZUNA_APP_KEY,
        results_per_page: resultsLimit,
        what
      }
    });

    const results = response.data?.results || [];
    let syncedCount = 0;
    
    for (const rawJob of results) {
      const cleanTitle = String(rawJob.title || "").replace(/<\/?[^>]+(>|$)/g, "").trim();
      const companyName = String(rawJob.company?.display_name || "Hiring Company").trim();
      const locationName = String(rawJob.location?.display_name || "India").trim();
      const applyUrl = String(rawJob.redirect_url || "").trim();
      const description = String(rawJob.description || "").replace(/<\/?[?#]*[^>]+(>|$)/g, "").trim();
      
      const parsedSalaryMin = rawJob.salary_min ? Number(rawJob.salary_min) : undefined;
      const parsedSalaryMax = rawJob.salary_max ? Number(rawJob.salary_max) : undefined;
      
      const skillsRequired = rawJob.category?.label ? [rawJob.category.label] : [];
      const devSkills = ["react", "node", "typescript", "javascript", "mongodb", "python", "sql", "java"];
      for (const skill of devSkills) {
        if (description.toLowerCase().includes(skill)) {
          skillsRequired.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
      }

      const jobData = {
        title: cleanTitle || "Software Engineer",
        company: companyName,
        location: locationName,
        remoteType: description.toLowerCase().includes("remote") ? "Remote" : (description.toLowerCase().includes("hybrid") ? "Hybrid" : "Onsite"),
        jobType: "Full-time",
        experienceRequired: "0-2 years",
        salaryMin: parsedSalaryMin,
        salaryMax: parsedSalaryMax,
        currency: country.toLowerCase() === "in" ? "INR" : "GBP",
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
        externalId: String(rawJob.id || ""),
        source: "Adzuna Jobs",
        sourceType: "api-provider",
        postedAt: rawJob.created ? new Date(rawJob.created) : new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const syncResult = await createManualJob(jobData);
      if (!syncResult.duplicate) {
        syncedCount++;
      }
    }

    console.info(`Adzuna sync completed: successfully imported ${syncedCount} new jobs.`);
    return { syncedCount, message: "Sync successful" };
  } catch (error: any) {
    console.error("Adzuna API sync error:", error.message);
    return { syncedCount: 0, error: error.message };
  }
}
