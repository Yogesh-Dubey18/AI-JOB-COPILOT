import axios from "axios";
import { env } from "../../config/env.js";
import { findRecords } from "../../utils/repository.js";
import { createManualJob } from "../job.service.js";
import { enrichJobFields } from "../job-normalizer.js";

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
      const fields = enrichJobFields({
        title: rawJob.title,
        description: rawJob.description,
        tags: rawJob.category?.label ? [rawJob.category.label] : [],
        jobTypeHint: [rawJob.contract_time, rawJob.contract_type].filter(Boolean).join(" "),
        // Adzuna marks estimated pay with salary_is_predicted = "1"; showing it as a real range would mislead.
        salaryMin: String(rawJob.salary_is_predicted) === "1" ? undefined : rawJob.salary_min,
        salaryMax: String(rawJob.salary_is_predicted) === "1" ? undefined : rawJob.salary_max,
        defaultCurrency: country.toLowerCase() === "in" ? "INR" : "GBP"
      });
      const companyName = String(rawJob.company?.display_name || "Hiring Company").trim();
      const locationName = String(rawJob.location?.display_name || "India").trim();
      const applyUrl = String(rawJob.redirect_url || "").trim();

      const postedAt = rawJob.created ? new Date(rawJob.created) : new Date();
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

const DEFAULT_CATEGORIES = ["it-jobs", "engineering-jobs", "graduate-jobs"];
const DEFAULT_CITIES = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Noida", "Gurugram"];
const MAX_PROFILE_ROLES = 5;
const MAX_PROFILE_CITIES = 4;

export type AdzunaSearch = { what: string; where: string; page: number; category?: string };

function topTerms(values: unknown[], limit: number, maxLength: number) {
  const counts = new Map<string, { label: string; count: number }>();
  for (const value of values) {
    const label = String(value || "").replace(/\s+/g, " ").trim();
    const key = label.toLowerCase();
    if (!label || label.length > maxLength || /remote|anywhere|any location/i.test(label)) continue;
    const entry = counts.get(key) || { label, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, limit).map((entry) => entry.label);
}

/**
 * Builds the list of Adzuna searches for one sync: the original broad IT/engineering sweep, plus
 * searches for the roles and cities real users asked for (any field, not only developers).
 */
export function buildAdzunaSearchPlan(profiles: Array<{ targetRoles?: unknown[]; preferredLocations?: unknown[] }> = [], maxCalls = 80): AdzunaSearch[] {
  const plan: AdzunaSearch[] = [];
  for (const category of DEFAULT_CATEGORIES) {
    for (const city of DEFAULT_CITIES) {
      for (const page of [1, 2]) plan.push({ what: "developer", where: city, page, category });
    }
  }

  const roles = topTerms(profiles.flatMap((profile) => profile.targetRoles || []), MAX_PROFILE_ROLES, 60);
  const profileCities = topTerms(profiles.flatMap((profile) => profile.preferredLocations || []), MAX_PROFILE_CITIES, 40);
  const cities = profileCities.length > 0 ? profileCities : DEFAULT_CITIES.slice(0, MAX_PROFILE_CITIES);
  const seen = new Set(plan.map((item) => `${item.what}|${item.where}|${item.page}|${item.category || ""}`.toLowerCase()));
  // Role searches go first so a call cap trims the generic sweep, not what users actually want.
  const roleSearches: AdzunaSearch[] = [];
  for (const role of roles) {
    for (const city of cities) {
      const search = { what: role, where: city, page: 1 };
      const key = `${search.what}|${search.where}|1|`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        roleSearches.push(search);
      }
    }
  }
  return [...roleSearches, ...plan].slice(0, Math.max(1, maxCalls));
}

export async function runFullAdzunaSync() {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
    console.info("Adzuna API credentials missing. Full sync skipped.");
    return { totalSynced: 0, message: "Adzuna credentials not configured" };
  }
  console.info("Starting full Adzuna India job synchronization...");
  let profiles: any[] = [];
  try {
    profiles = await findRecords("profiles", {}, { limit: 500 });
  } catch (err: any) {
    console.error("Could not load profiles for Adzuna search plan:", err.message);
  }
  const maxCalls = Number(process.env.ADZUNA_MAX_CALLS_PER_SYNC) > 0 ? Number(process.env.ADZUNA_MAX_CALLS_PER_SYNC) : 80;
  const plan = buildAdzunaSearchPlan(profiles, maxCalls);
  let totalSynced = 0;
  let failures = 0;

  for (const search of plan) {
    try {
      console.info(`Syncing "${search.what}" in ${search.where} (page ${search.page}${search.category ? `, ${search.category}` : ""})...`);
      const result = await syncAdzunaJobs(search.what, "in", 50, search.page, search.where, { category: search.category });
      totalSynced += result.syncedCount || 0;
      if ((result as any).error) failures += 1;
      // Small delay between calls to be a good API citizen
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err: any) {
      failures += 1;
      console.error(`Sync failed for "${search.what}" in ${search.where}:`, err.message);
    }
  }

  console.info(`Full Adzuna sync completed: ${totalSynced} new jobs from ${plan.length} searches (${failures} failed).`);
  return {
    totalSynced,
    message: "Sync successful",
    error: failures > 0 && failures === plan.length ? "All Adzuna searches failed" : undefined
  };
}
