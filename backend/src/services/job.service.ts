import { ApiError } from "../utils/ApiError.js";
import { countRecords, createRecord, findOneRecord, findRecordById, findRecords, deleteRecord, updateRecord } from "../utils/repository.js";
import { createApplication } from "./application.service.js";
import { listJobSourceReadiness, normalizeJobSourceJob, parseCsvPreview } from "./job-source.service.js";
import { technicalKeywordBank } from "./ats-scoring.service.js";
import { aiService } from "../ai/ai.service.js";
import { createNotification } from "./notification.service.js";

import mongoose from "mongoose";
import { isDbReady } from "../config/db.js";
import { updateApplicationStatus } from "./application.service.js";

async function saveSyncStatusToDb(lastSyncedAt: Date, newJobsCount: number, status: "success" | "failed" | "partial") {
  if (isDbReady() && mongoose.connection.db) {
    try {
      const col = mongoose.connection.db.collection("sys_sync_status");
      await col.updateOne(
        { key: "jobs" },
        { $set: { lastSyncedAt, newJobsCount, status, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (e) {
      console.error("Failed to save sync status to MongoDB:", e);
    }
  }
}

async function loadSyncStatusFromDb() {
  if (isDbReady() && mongoose.connection.db) {
    try {
      const col = mongoose.connection.db.collection("sys_sync_status");
      const doc = await col.findOne({ key: "jobs" });
      if (doc) {
        return {
          lastSyncedAt: doc.lastSyncedAt ? new Date(doc.lastSyncedAt) : null,
          newJobsCount: doc.newJobsCount || 0,
          status: doc.status || "success"
        };
      }
    } catch (e) {
      console.error("Failed to load sync status from MongoDB:", e);
    }
  }
  return null;
}

let lastSyncTime: Date | null = null;
let lastNewJobsCount = 0;
let lastSyncStatus = "success";

async function getOrLoadSyncStatus() {
  if (lastSyncTime === null) {
    const dbStatus = await loadSyncStatusFromDb();
    if (dbStatus) {
      lastSyncTime = dbStatus.lastSyncedAt;
      lastNewJobsCount = dbStatus.newJobsCount;
      lastSyncStatus = dbStatus.status;
    }
  }
  return { lastSyncTime, lastNewJobsCount, lastSyncStatus };
}

export const sampleJobs = [
  ["React Developer", "PixelCraft Labs", "Bengaluru", "Hybrid", "Full-time", "0-2 years", ["React", "TypeScript", "Tailwind", "REST API"]],
  ["MERN Stack Developer", "StackNova", "Remote", "Remote", "Full-time", "0-1 years", ["React", "Node.js", "Express", "MongoDB"]],
  ["Node.js Developer", "ApiForge", "Pune", "Onsite", "Full-time", "1-2 years", ["Node.js", "Express", "MongoDB", "JWT"]],
  ["Full Stack Developer", "CareerOS", "Hyderabad", "Hybrid", "Full-time", "0-2 years", ["React", "Node.js", "MongoDB", "TypeScript"]],
  ["Java Developer", "CoreBridge", "Chennai", "Onsite", "Full-time", "0-2 years", ["Java", "DSA", "SQL", "Spring Boot"]],
  ["Frontend Developer Intern", "DesignLoop", "Remote", "Remote", "Internship", "Fresher", ["React", "JavaScript", "CSS", "HTML"]],
  ["Backend Developer Intern", "ServerSide Co", "Mumbai", "Hybrid", "Internship", "Fresher", ["Node.js", "Express", "MongoDB", "REST API"]],
  ["Remote Full Stack Intern", "LaunchPad AI", "Remote", "Remote", "Internship", "Fresher", ["React", "Node.js", "Git", "APIs"]],
  ["Junior Software Engineer", "DevHarbor", "Noida", "Hybrid", "Full-time", "0-1 years", ["JavaScript", "DSA", "React", "SQL"]]
];

export async function ensureSampleJobs() {
  if ((await countRecords("jobs")) > 0) return;
  const now = Date.now();
  for (const [index, item] of sampleJobs.entries()) {
    const [title, company, location, remoteType, jobType, experienceRequired, skillsRequired] = item as any;
    await createRecord("jobs", normalizeJobSourceJob({
      title,
      company,
      location,
      remoteType,
      jobType,
      experienceRequired,
      salaryMin: 300000 + index * 50000,
      salaryMax: 700000 + index * 75000,
      currency: "INR",
      description: title + " role for job seekers with practical projects and strong fundamentals.",
      responsibilities: ["Build user-facing features", "Work with APIs", "Document decisions", "Collaborate with product and engineering"],
      requirements: ["Portfolio projects", "Good communication", "Core programming fundamentals"],
      skillsRequired,
      applyUrl: "https://example.com/apply/" + index,
      source: index % 2 ? "Company careers" : "Curated job board",
      trustScore: 82 - index,
      scamRiskScore: 8 + index,
      postedAt: new Date(now - index * 86400000),
      expiresAt: new Date(now + (20 + index) * 86400000)
    }));
  }
}

async function cleanupDuplicates() {
  const jobs = await findRecords("jobs", {}, { sort: { createdAt: -1 } });
  const seenKeys = new Set<string>();
  const duplicateIds: string[] = [];
  
  for (const job of jobs) {
    const key = job.duplicateKey || `${(job.normalizedTitle || job.title).toLowerCase()}_${(job.normalizedCompany || job.company).toLowerCase()}_${(job.location || "").toLowerCase()}`;
    if (seenKeys.has(key)) {
      duplicateIds.push(String(job._id));
    } else {
      seenKeys.add(key);
    }
  }
  
  if (duplicateIds.length > 0) {
    console.info(`Found ${duplicateIds.length} duplicate jobs during cleanup. Deleting...`);
    for (const id of duplicateIds) {
      await deleteRecord("jobs", id);
    }
  }
}

async function notifyUsersOfNewJobs(newJobsCount: number) {
  if (newJobsCount <= 0) return;
  const profiles = await findRecords("profiles");
  for (const profile of profiles) {
    const userId = String(profile.userId);
    await createNotification(userId, {
      type: "job_match",
      title: "New Matching Jobs Found",
      message: `We found ${newJobsCount} new jobs from our latest feed refresh. Check them out!`,
      actionUrl: "/jobs",
      dedupeKey: `new-jobs-sync:${new Date().toISOString().slice(0, 10)}`
    });
  }
}

export async function refreshJobs(userId: string) {
  const COOLDOWN_MS = 60 * 1000; // 60 seconds
  const now = new Date();
  
  const { lastSyncTime: syncTime, lastNewJobsCount: newJobs, lastSyncStatus: syncStatus } = await getOrLoadSyncStatus();
  
  if (process.env.NODE_ENV !== "test" && syncTime && (now.getTime() - syncTime.getTime() < COOLDOWN_MS)) {
    const cooldownRemainingMs = COOLDOWN_MS - (now.getTime() - syncTime.getTime());
    return {
      success: true,
      message: "Refresh cooldown active. Feed is already up-to-date.",
      cooldownRemainingMs,
      newJobsCount: newJobs,
      lastSyncedAt: syncTime.toISOString(),
      status: syncStatus
    };
  }
  
  console.info(`Triggering manual job refresh for user ${userId}...`);
  try {
    const { syncAdzunaJobs } = await import("./job-providers/adzuna.provider.js");
    
    // Quick sync: Page 1, 50 jobs
    const syncResult = await syncAdzunaJobs("developer", "in", 50, 1);
    const count = syncResult.syncedCount || 0;
    
    await cleanupDuplicates();
    await cleanupExpiredJobs();
    
    if (count > 0) {
      await notifyUsersOfNewJobs(count);
    }
    
    lastSyncTime = now;
    lastNewJobsCount = count;
    lastSyncStatus = "success";
    await saveSyncStatusToDb(now, count, "success");
    
    return {
      success: true,
      message: count > 0 ? `${count} new jobs found!` : "No new jobs found. Feed is up-to-date.",
      newJobsCount: count,
      lastSyncedAt: now.toISOString(),
      cooldownRemainingMs: COOLDOWN_MS,
      status: "success"
    };
  } catch (error: any) {
    console.error("Manual job refresh failed:", error);
    lastSyncTime = now;
    lastNewJobsCount = 0;
    lastSyncStatus = "failed";
    await saveSyncStatusToDb(now, 0, "failed");
    throw new ApiError(500, `Job refresh failed: ${error.message}`);
  }
}

export async function getSyncStatus() {
  const COOLDOWN_MS = 60 * 1000;
  const now = new Date();
  const { lastSyncTime: syncTime, lastNewJobsCount: newJobs, lastSyncStatus: syncStatus } = await getOrLoadSyncStatus();
  const cooldownRemainingMs = syncTime
    ? Math.max(0, COOLDOWN_MS - (now.getTime() - syncTime.getTime()))
    : 0;

  return {
    lastSyncedAt: syncTime ? syncTime.toISOString() : null,
    cooldownRemainingMs,
    newJobsCount: newJobs,
    status: syncStatus
  };
}

export async function listJobs(query: any = {}) {
  await ensureSampleJobs();
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Number(query.limit || 20), 50);
  const search = query.search || query.role || "";
  
  let userSkills: string[] = [];
  let targetRoles: string[] = [];
  let userExpLevel = "fresher";
  let userExpectedSalary: number | null = null;
  let preferredLocations: string[] = [];
  let preferredJobTypes: string[] = [];
  let userLastJobsViewedAt: Date | null = null;
  const appliedJobIds = new Set<string>();
  const savedJobIds = new Set<string>();

  if (query.userId) {
    const profile = await findOneRecord("profiles", { userId: query.userId });
    if (profile) {
      userSkills = (profile.skills || []).map((s: string) => s.toLowerCase());
      targetRoles = (profile.targetRoles || []).map((s: string) => s.toLowerCase());
      userExpLevel = profile.experienceLevel || "fresher";
      userExpectedSalary = profile.expectedSalary || null;
      preferredLocations = (profile.preferredLocations || []).map((s: string) => s.toLowerCase());
      preferredJobTypes = (profile.preferredJobTypes || []).map((s: string) => s.toLowerCase());
      userLastJobsViewedAt = profile.lastJobsViewedAt || null;
    }

    let resumeForSkills = null;
    if (query.fromResume) {
      try {
        resumeForSkills = await findRecordById("resumes", String(query.fromResume));
      } catch (err) {
        // ignore
      }
    }
    if (!resumeForSkills) {
      resumeForSkills = await findOneRecord("resumes", { userId: query.userId, isBaseResume: true })
        || (await findRecords("resumes", { userId: query.userId }, { sort: { createdAt: -1 }, limit: 1 }))[0] || null;
    }
    if (resumeForSkills && resumeForSkills.parsedData) {
      const resumeSkills = (resumeForSkills.parsedData.skills || []).map((s: string) => s.toLowerCase());
      userSkills = Array.from(new Set([...userSkills, ...resumeSkills]));
    }

    const applications = await findRecords("applications", { userId: query.userId });
    applications.forEach((app: any) => {
      if (app.jobId) {
        if (app.status === "Saved") {
          savedJobIds.add(String(app.jobId));
        } else {
          appliedJobIds.add(String(app.jobId));
        }
      }
    });
  }

  let jobs = await findRecords("jobs", {}, { sort: { postedAt: -1 } });
  
  // Exclude expired jobs
  const nowTime = Date.now();
  jobs = jobs.filter((job: any) => !job.expiresAt || new Date(job.expiresAt).getTime() > nowTime);

  // Exclude applied/saved jobs if user is authenticated and hideApplied toggle is active (defaulting to true)
  if (query.userId) {
    const hideApplied = query.hideApplied !== "false";
    if (hideApplied) {
      jobs = jobs.filter((job: any) => !appliedJobIds.has(String(job._id)) && !savedJobIds.has(String(job._id)));
    }
  }

  if (search) {
    const needle = String(search).toLowerCase();
    jobs = jobs.filter((job: any) => [job.title, job.company, job.location, ...(job.skillsRequired || [])].join(" ").toLowerCase().includes(needle));
  }
  if (query.remoteType) jobs = jobs.filter((job: any) => job.remoteType === query.remoteType);
  if (query.jobType) jobs = jobs.filter((job: any) => job.jobType === query.jobType);
  if (query.location) jobs = jobs.filter((job: any) => String(job.location || "").toLowerCase().includes(String(query.location).toLowerCase()));
  if (query.skill) jobs = jobs.filter((job: any) => (job.skillsRequired || []).some((skill: string) => skill.toLowerCase().includes(String(query.skill).toLowerCase())));
  if (query.company) jobs = jobs.filter((job: any) => String(job.company || "").toLowerCase().includes(String(query.company).toLowerCase()));
  if (query.sourceType) jobs = jobs.filter((job: any) => job.sourceType === query.sourceType);
  if (query.freshersOnly === "true") jobs = jobs.filter((job: any) => /fresh|0-1|0-2/i.test(job.experienceRequired));
  if (query.internshipOnly === "true") jobs = jobs.filter((job: any) => job.jobType === "Internship");
  if (query.trustMin) jobs = jobs.filter((job: any) => Number(job.trustScore || 0) >= Number(query.trustMin));
  if (query.salaryMin) jobs = jobs.filter((job: any) => Number(job.salaryMax || job.salaryMin || 0) >= Number(query.salaryMin));
  if (query.salaryMax) jobs = jobs.filter((job: any) => Number(job.salaryMin || job.salaryMax || 0) <= Number(query.salaryMax));
  if (query.experienceLevel) jobs = jobs.filter((job: any) => String(job.experienceRequired || "").toLowerCase().includes(String(query.experienceLevel).toLowerCase()));
  
  // Calculate dynamic match scores and badges
  const now = new Date();
  let enrichedJobs = jobs.map((job: any) => {
    const importedDate = new Date(job.importedAt || job.createdAt || now);
    const msSinceImport = now.getTime() - importedDate.getTime();
    let isNew = false;
    if (query.userId && userLastJobsViewedAt) {
      isNew = importedDate.getTime() > new Date(userLastJobsViewedAt).getTime();
    } else {
      isNew = msSinceImport < 24 * 60 * 60 * 1000;
    }
    const isRecentlyAdded = msSinceImport < 3 * 24 * 60 * 60 * 1000;
    
    let isExpiringSoon = false;
    if (job.expiresAt) {
      const msUntilExpire = new Date(job.expiresAt).getTime() - now.getTime();
      isExpiringSoon = msUntilExpire > 0 && msUntilExpire < 3 * 24 * 60 * 60 * 1000;
    }

    let matchScore = 0;
    const whyMatchedReasons: string[] = [];
    let matchedSkills: string[] = [];
    let missingSkills: string[] = [];

    const jobSkills = (job.skillsRequired || []).map((s: string) => s.trim());
    const jobSkillsLower = jobSkills.map((s: string) => s.toLowerCase());

    if (query.userId && (userSkills.length > 0 || targetRoles.length > 0)) {
      if (jobSkillsLower.length > 0) {
        matchedSkills = jobSkills.filter((s: string) => userSkills.includes(s.toLowerCase()));
        missingSkills = jobSkills.filter((s: string) => !userSkills.includes(s.toLowerCase()));
        const skillPct = matchedSkills.length / jobSkillsLower.length;
        matchScore += Math.round(skillPct * 50);
      } else {
        matchScore += 35;
      }

      const jobTitleLower = job.title.toLowerCase();
      const matchesRole = targetRoles.some(r => jobTitleLower.includes(r) || (job.normalizedTitle && job.normalizedTitle.toLowerCase().includes(r)));
      if (matchesRole) {
        matchScore += 20;
        whyMatchedReasons.push("Matches your target role preferences.");
      } else {
        matchScore += 5;
      }

      const jobExpLower = (job.experienceRequired || "").toLowerCase();
      let expFit = false;
      if (userExpLevel === "fresher") {
        if (/fresh|0-1|0-2|intern/i.test(jobExpLower)) expFit = true;
      } else if (userExpLevel === "junior") {
        if (/1-3|2-4|junior|0-2/i.test(jobExpLower)) expFit = true;
      } else if (userExpLevel === "mid") {
        if (/3-5|4-6|mid/i.test(jobExpLower)) expFit = true;
      } else if (userExpLevel === "senior") {
        if (/5\+|senior|lead|architect/i.test(jobExpLower)) expFit = true;
      }
      
      if (expFit) {
        matchScore += 15;
      } else {
        matchScore += 5;
      }

      const jobRemote = (job.remoteType || "").toLowerCase();
      const isRemotePref = preferredLocations.includes("remote") || preferredJobTypes.includes("remote");
      if (jobRemote === "remote" && isRemotePref) {
        matchScore += 10;
        whyMatchedReasons.push("Remote opportunity matching your preference.");
      } else {
        const jobLocLower = (job.location || "").toLowerCase();
        const matchesLoc = preferredLocations.some(l => jobLocLower.includes(l));
        if (matchesLoc) {
          matchScore += 10;
          whyMatchedReasons.push(`Located in your preferred city: ${job.location}`);
        } else {
          matchScore += 5;
        }
      }

      if (userExpectedSalary && job.salaryMin) {
        if (job.salaryMin >= userExpectedSalary) {
          matchScore += 5;
        } else {
          matchScore += 2;
        }
      } else {
        matchScore += 5;
      }
    } else {
      matchScore = job.matchScore || 0;
    }

    let whyMatched = "";
    if (matchedSkills.length > 0) {
      whyMatched = `Matches ${matchedSkills.length} skill${matchedSkills.length > 1 ? "s" : ""} from your profile: ${matchedSkills.slice(0, 4).join(", ")}.`;
    } else if (whyMatchedReasons.length > 0) {
      whyMatched = whyMatchedReasons[0];
    } else if (query.userId) {
      whyMatched = "Curated match based on your target role.";
    }

    return {
      ...job,
      matchScore,
      whyMatched,
      strongFitSkills: matchedSkills,
      missingSkills,
      isNew,
      isRecentlyAdded,
      isExpiringSoon,
      isSaved: query.userId ? savedJobIds.has(String(job._id)) : false,
      isApplied: query.userId ? appliedJobIds.has(String(job._id)) : false
    };
  });

  const sort = String(query.sort || (query.userId ? "match" : "postedAt"));
  enrichedJobs = enrichedJobs.sort((a: any, b: any) => {
    if (sort === "salary") return Number(b.salaryMax || 0) - Number(a.salaryMax || 0);
    if (sort === "trust") return Number(b.trustScore || 0) - Number(a.trustScore || 0);
    if (sort === "scamRisk") return Number(a.scamRiskScore || 0) - Number(b.scamRiskScore || 0);
    if (sort === "match") return Number(b.matchScore || 0) - Number(a.matchScore || 0);
    return new Date(b.postedAt || b.createdAt || 0).getTime() - new Date(a.postedAt || a.createdAt || 0).getTime();
  });

  const start = (page - 1) * limit;
  return { items: enrichedJobs.slice(start, start + limit), page, limit, total: enrichedJobs.length };
}

export async function getJob(id: string) {
  await ensureSampleJobs();
  const job = await findRecordById("jobs", id);
  if (!job) throw new ApiError(404, "Job not found");
  return job;
}

export async function dailyFeed(query: any = {}) {
  const result = await listJobs({ ...query, limit: 12 });
  return {
    today: result.items.slice(0, 5),
    remote: result.items.filter((job: any) => job.remoteType === "Remote"),
    fresher: result.items.filter((job: any) => /fresh|0-1|0-2/i.test(job.experienceRequired)),
    internships: result.items.filter((job: any) => job.jobType === "Internship")
  };
}

export async function saveJob(userId: string, jobId: string) {
  const job = await getJob(jobId);
  return createApplication(userId, {
    jobId,
    company: job.company,
    role: job.title,
    applicationSource: job.source,
    status: "Saved"
  });
}

export async function createManualJob(input: any) {
  const normalized = normalizeJobSourceJob({ ...input, source: input.source || "Manual import" });
  let duplicate = await findOneRecord("jobs", { duplicateKey: normalized.duplicateKey });
  if (!duplicate) {
    duplicate = await findOneRecord("jobs", {
      normalizedTitle: normalized.normalizedTitle,
      normalizedCompany: normalized.normalizedCompany,
      location: normalized.location
    });
  }
  if (duplicate) {
    const updatedJob = await updateRecord("jobs", String(duplicate._id), {
      ...duplicate,
      ...normalized,
      updatedAt: new Date()
    });
    return { job: updatedJob, duplicate: true, duplicateKey: normalized.duplicateKey };
  }
  const job = await createRecord("jobs", normalized);
  return { job, duplicate: false, duplicateKey: normalized.duplicateKey };
}

export async function previewCsvJobs(csv: string) {
  if (!csv || csv.length > 20000) throw new ApiError(400, "CSV preview requires content under 20KB");
  const rows = parseCsvPreview(csv);
  const jobs = await findRecords("jobs", {});
  return rows.map((row) => ({
    ...row,
    duplicate: jobs.some((job: any) => job.duplicateKey === row.duplicateKey)
  }));
}

function includesTerm(text: string, term: string) {
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  if (/^[a-z0-9.+#-]+$/i.test(term)) return lowerText.includes(lowerTerm);
  return lowerTerm.split(/\s+/).every((part) => lowerText.includes(part));
}

function parseJobUrlHeuristically(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const hostParts = host.split(".");
    let company = hostParts[0];
    
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const isJobPortal = /lever\.co|greenhouse\.io|workable\.com|bamboohr\.com/i.test(host);
    
    if (isJobPortal && pathParts.length > 0) {
      company = pathParts[0];
    } else if (["jobs", "careers", "recruit", "recruiting", "app", "boards"].includes(company.toLowerCase()) && hostParts.length > 1) {
      company = hostParts[1];
    }
    company = company.charAt(0).toUpperCase() + company.slice(1);
    let title = "";
    for (const part of pathParts) {
      const cleaned = part.replace(/[^a-zA-Z]+/g, " ").trim();
      if (cleaned.length > 5) {
        if (/software|engineer|developer|manager|analyst|designer|architect|lead/i.test(cleaned)) {
          title = cleaned.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          break;
        }
      }
    }
    if (!title && pathParts.length) {
      const lastPart = pathParts[pathParts.length - 1];
      title = lastPart.replace(/[^a-zA-Z]+/g, " ").trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return {
      title: title || "Software Developer",
      company: company || "Hiring Company",
      location: "Remote",
      remoteType: "Remote",
      jobType: "Full-time",
      applyUrl: url,
      description: `Job listing imported from URL: ${url}`,
      skillsRequired: ["React", "Node.js", "TypeScript"],
      responsibilities: ["Develop and maintain software applications", "Collaborate on product integration workflows"],
      requirements: ["Strong programming fundamentals", "Good problem-solving skills"]
    };
  } catch {
    return null;
  }
}

function parseJobTextHeuristically(text: string) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  
  let title = "";
  const titleLine = lines.find(l => /^(job\s+)?title:|^(role|position):/i.test(l));
  if (titleLine) {
    title = titleLine.replace(/^(job\s+)?title:|^(role|position):/i, "").trim();
  } else {
    const commonRoles = [
      /software engineer/i, /full\s*stack/i, /frontend/i, /backend/i, /developer/i,
      /data scientist/i, /devops/i, /qa engineer/i, /product manager/i, /intern/i
    ];
    for (const line of lines.slice(0, 5)) {
      if (commonRoles.some(r => r.test(line)) && line.length < 60) {
        title = line;
        break;
      }
    }
  }
  if (!title) title = "Software Developer";

  let company = "";
  const companyLine = lines.find(l => /^company:|^organization:/i.test(l));
  if (companyLine) {
    company = companyLine.replace(/^company:|^organization:/i, "").trim();
  } else {
    const companyMatch = text.match(/at\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s+is\s+looking|\s+seeks|\s+team|\.|\n)/);
    if (companyMatch) {
      company = companyMatch[1].trim();
    }
  }
  if (!company) company = "Hiring Company";

  let location = "Remote";
  let remoteType = "Remote";
  if (/hybrid/i.test(text)) {
    remoteType = "Hybrid";
    location = "Hybrid";
  } else if (/onsite|on-site/i.test(text)) {
    remoteType = "Onsite";
    location = "Office";
  }
  
  const cities = ["Bengaluru", "Bangalore", "Pune", "Hyderabad", "Mumbai", "Chennai", "Delhi", "Noida", "Gurugram", "San Francisco", "New York", "London"];
  for (const city of cities) {
    if (new RegExp(city, "i").test(text)) {
      location = city;
      break;
    }
  }

  let jobType = "Full-time";
  if (/internship|intern\b/i.test(text)) {
    jobType = "Internship";
  } else if (/contract|contractor/i.test(text)) {
    jobType = "Contract";
  } else if (/part-time|parttime/i.test(text)) {
    jobType = "Part-time";
  }

  const skillsRequired: string[] = [];
  technicalKeywordBank.forEach((skill) => {
    if (includesTerm(text, skill)) {
      skillsRequired.push(skill);
    }
  });

  const description = lines.slice(0, 3).join(" ").substring(0, 300) + "...";
  
  const responsibilities: string[] = [];
  const requirements: string[] = [];
  
  let section: "none" | "responsibilities" | "requirements" = "none";
  for (const line of lines) {
    if (/responsibility|responsibilities|what you will do|role duties|key tasks/i.test(line)) {
      section = "responsibilities";
      continue;
    }
    if (/requirement|requirements|what we look for|qualifications|experience required/i.test(line)) {
      section = "requirements";
      continue;
    }
    
    if (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)) {
      const cleanedLine = line.replace(/^[-*\d.]+\s*/, "").trim();
      if (section === "responsibilities" && responsibilities.length < 6) {
        responsibilities.push(cleanedLine);
      } else if (section === "requirements" && requirements.length < 6) {
        requirements.push(cleanedLine);
      }
    }
  }

  if (responsibilities.length === 0) {
    responsibilities.push("Design and implement feature components", "Collaborate on product integration workflows");
  }
  if (requirements.length === 0) {
    requirements.push("Strong core programming logic", "Familiarity with modern software tech stack");
  }

  return {
    title,
    company,
    location,
    remoteType,
    jobType,
    skillsRequired: skillsRequired.slice(0, 10),
    description,
    responsibilities,
    requirements
  };
}

export async function parseJobText(text: string, userId?: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new ApiError(400, "Job text cannot be empty");

  if (/^https?:\/\//i.test(trimmed)) {
    const urlData = parseJobUrlHeuristically(trimmed);
    if (urlData) return urlData;
  }

  const isAiLive = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
  const fallback = parseJobTextHeuristically(trimmed);
  if (isAiLive) {
    try {
      const parsedData = await aiService.parseJobText(userId, { text: trimmed, fallback });
      if (parsedData && (parsedData.title || parsedData.company)) {
        return {
          title: parsedData.title || fallback.title,
          company: parsedData.company || fallback.company,
          location: parsedData.location || fallback.location,
          remoteType: parsedData.remoteType || fallback.remoteType,
          jobType: parsedData.jobType || fallback.jobType,
          salaryMin: parsedData.salaryMin || undefined,
          salaryMax: parsedData.salaryMax || undefined,
          skillsRequired: parsedData.skillsRequired || fallback.skillsRequired,
          description: parsedData.description || fallback.description,
          responsibilities: parsedData.responsibilities || fallback.responsibilities,
          requirements: parsedData.requirements || fallback.requirements,
          applyUrl: parsedData.applyUrl || ""
        };
      }
    } catch (e) {
      console.warn("AI parsing failed, falling back to heuristics:", e);
    }
  }

  return fallback;
}

export function getJobSources() {
  return listJobSourceReadiness();
}

export async function cleanupExpiredJobs() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const jobs = await findRecords("jobs", {});
  
  let deletedCount = 0;
  for (const job of jobs) {
    const isExpired = job.expiresAt && new Date(job.expiresAt).getTime() < now.getTime();
    const isStale = (job.postedAt && new Date(job.postedAt).getTime() < thirtyDaysAgo.getTime()) ||
                    (job.createdAt && new Date(job.createdAt).getTime() < thirtyDaysAgo.getTime());
                    
    if (isExpired || isStale) {
      await deleteRecord("jobs", String(job._id));
      deletedCount++;
    }
  }
  
  console.info(`Cleaned up ${deletedCount} expired or stale jobs.`);
  return { deletedCount };
}

export async function updateLastJobsViewedAt(userId: string) {
  const profile = await findOneRecord("profiles", { userId });
  if (!profile) {
    return createRecord("profiles", { userId, lastJobsViewedAt: new Date() });
  }
  return updateRecord("profiles", String(profile._id), {
    ...profile,
    lastJobsViewedAt: new Date()
  });
}

export async function applyJob(userId: string, jobId: string) {
  const job = await getJob(jobId);
  const existingApp = await findOneRecord("applications", { userId, jobId });
  if (existingApp) {
    return updateApplicationStatus(userId, String(existingApp._id), "Applied");
  }
  return createApplication(userId, {
    jobId,
    company: job.company,
    role: job.title,
    applicationSource: job.source,
    status: "Applied"
  });
}

export async function runJobExpirationBackfill() {
  if (isDbReady() && mongoose.connection.db) {
    try {
      const col = mongoose.connection.db.collection("jobs");
      const jobs = await col.find({ postedAt: { $exists: true } }).toArray();
      let updatedCount = 0;
      for (const job of jobs) {
        const postedAt = new Date(job.postedAt);
        const correctExpiresAt = new Date(postedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (!job.expiresAt || Math.abs(new Date(job.expiresAt).getTime() - correctExpiresAt.getTime()) > 60000) {
          await col.updateOne({ _id: job._id }, { $set: { expiresAt: correctExpiresAt } });
          updatedCount++;
        }
      }
      console.info(`[Migration] Recalculated expiresAt relative to postedAt for ${updatedCount} jobs.`);
    } catch (e) {
      console.error("[Migration] Job expiration backfill failed:", e);
    }
  }
}


