import { createRecord, deleteRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { ensureSampleJobs } from "./job.service.js";
import { normalizeJobSourceJob } from "./job-source.service.js";

export async function listUsers() {
  return findRecords("users", {}, { sort: { createdAt: -1 } });
}

export async function listAdminJobs() {
  await ensureSampleJobs();
  return findRecords("jobs", {}, { sort: { postedAt: -1 } });
}

export async function createAdminJob(input: any) {
  return createRecord("jobs", normalizeJobSourceJob({ ...input, source: input.source || "Admin manual import" }));
}

export async function updateAdminJob(id: string, input: any) {
  const existing = await findRecordById("jobs", id);
  return updateRecord("jobs", id, normalizeJobSourceJob({ ...(existing || {}), ...input }));
}

export async function deleteAdminJob(id: string) {
  return deleteRecord("jobs", id);
}

export async function aiUsage() {
  return findRecords("aiRequests", {}, { sort: { createdAt: -1 }, limit: 100 });
}

export async function reports() {
  return findRecords("jobScamReports", {}, { sort: { createdAt: -1 }, limit: 100 });
}

export async function feedback() {
  return findRecords("feedback", {}, { sort: { createdAt: -1 }, limit: 100 });
}
