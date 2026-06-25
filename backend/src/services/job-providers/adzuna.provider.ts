import axios from "axios";
import { env } from "../../config/env.js";
import { createManualJob } from "../job.service.js";

export async function syncAdzunaJobs(
  what = "developer",
  country = "in",
  resultsLimit = 50,
  page = 1,
  where = "",
  options: {
    what_or?: string[];
    sort_by?: string;
    days_old?: number;
    category?: string;
  } = {}
) {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
    console.info("Adzuna API credentials missing. Sync skipped.");
    return { syncedCount: 0, message: "Adzuna credentials not configured" };
  }

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
    const response = await axios.get(url, {
      params: {
        app_id: env.ADZUNA_APP_ID,
        app_key: env.ADZUNA_APP_KEY,
        results_per_page: resultsLimit,
        what,
        where: where || undefined,
        category: options.category || undefined,
        sort_by: options.sort_by || "date",
        max_days_old: options.days_old !== undefined ? options.days_old : 3
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

      const postedAt = rawJob.created ? new Date(rawJob.created) : new Date();
      const expiresAt = new Date(postedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

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
        postedAt,
        expiresAt
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

export async function runFullAdzunaSync() {
  console.info("Starting full Adzuna India job synchronization...");
  const categories = ["it-jobs", "engineering-jobs", "graduate-jobs"];
  const cities = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Noida", "Gurugram"];
  const pages = [1, 2];
  let totalSynced = 0;

  for (const category of categories) {
    for (const city of cities) {
      for (const page of pages) {
        try {
          console.info(`Syncing category: ${category}, city: ${city}, page: ${page}...`);
          const result = await syncAdzunaJobs("developer", "in", 50, page, city, { category });
          totalSynced += result.syncedCount || 0;
          // Add a small delay between calls to be a good API citizen
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err: any) {
          console.error(`Sync failed for category ${category}, city ${city}, page ${page}:`, err.message);
        }
      }
    }
  }

  console.info(`Full Adzuna sync completed: successfully imported ${totalSynced} total new jobs.`);
  return { totalSynced, message: "Sync successful" };
}
