import axios from "axios";
import { createManualJob } from "../job.service.js";

export async function syncRemotiveJobs(limit = 50) {
  try {
    const url = `https://remotive.com/api/remote-jobs?limit=${limit}`;
    const response = await axios.get(url);
    const results = response.data?.jobs || [];
    let syncedCount = 0;
    
    for (const rawJob of results) {
      const cleanTitle = String(rawJob.title || "").replace(/<\/?[^>]+(>|$)/g, "").trim();
      const companyName = String(rawJob.company_name || "Hiring Company").trim();
      const locationName = String(rawJob.candidate_required_location || "Remote").trim();
      const applyUrl = String(rawJob.url || "").trim();
      const description = String(rawJob.description || "").replace(/<\/?[?#]*[^>]+(>|$)/g, "").trim();
      
      const salaryStr = rawJob.salary || "";
      let parsedSalaryMin: number | undefined = undefined;
      let parsedSalaryMax: number | undefined = undefined;
      let currency = "USD";
      
      if (salaryStr) {
        const cleaned = salaryStr.toLowerCase().replace(/[^0-9k\-–]/g, "");
        const matches = cleaned.match(/(\d+)(k)?/g);
        if (matches) {
          const vals = matches.map(m => {
            let num = parseFloat(m);
            if (m.includes("k")) num *= 1000;
            return num;
          });
          if (vals.length >= 2) {
            parsedSalaryMin = vals[0];
            parsedSalaryMax = vals[1];
          } else if (vals.length === 1) {
            parsedSalaryMin = vals[0];
            parsedSalaryMax = vals[0];
          }
        }
      }

      const skillsRequired = Array.isArray(rawJob.tags) ? rawJob.tags : [];
      const devSkills = ["react", "node", "typescript", "javascript", "mongodb", "python", "sql", "java"];
      for (const skill of devSkills) {
        if (description.toLowerCase().includes(skill)) {
          skillsRequired.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
      }

      const postedAt = rawJob.publication_date ? new Date(rawJob.publication_date) : new Date();
      const expiresAt = new Date(postedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

      const jobData = {
        title: cleanTitle || "Software Engineer",
        company: companyName,
        location: locationName,
        remoteType: "Remote",
        jobType: "Full-time",
        experienceRequired: "0-2 years",
        salaryMin: parsedSalaryMin,
        salaryMax: parsedSalaryMax,
        currency,
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
