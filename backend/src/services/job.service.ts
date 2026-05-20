import { ApiError } from "../utils/ApiError.js";
import { countRecords, createRecord, findRecordById, findRecords } from "../utils/repository.js";
import { createApplication } from "./application.service.js";
import { normalizeJobSourceJob, parseCsvPreview } from "./job-source.service.js";

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

export async function listJobs(query: any = {}) {
  await ensureSampleJobs();
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Number(query.limit || 20), 50);
  const search = query.search || query.role || "";
  let jobs = await findRecords("jobs", {}, { sort: { postedAt: -1 } });
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
  const start = (page - 1) * limit;
  return { items: jobs.slice(start, start + limit), page, limit, total: jobs.length };
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
  const jobs = await findRecords("jobs", {});
  const duplicate = jobs.find((job: any) => job.duplicateKey === normalized.duplicateKey);
  if (duplicate) return { job: duplicate, duplicate: true, duplicateKey: normalized.duplicateKey };
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
