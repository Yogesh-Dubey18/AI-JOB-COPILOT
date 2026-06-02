import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords } from "../utils/repository.js";
import { getJob } from "./job.service.js";
import { scoreResumeForRole } from "./ats-scoring.service.js";

export async function matchJob(userId: string, jobId: string, resumeId?: string) {
  const job = await getJob(jobId);
  const resumes = resumeId ? [await findRecordById("resumes", resumeId)] : await findRecords("resumes", { userId }, { limit: 1, sort: { createdAt: -1 } });
  const resume = resumes[0];
  if (!resume) throw new ApiError(400, "Upload a resume before matching jobs");
  const result = await aiService.matchJob(userId, { job, resume, formula: { skill: 40, project: 20, experience: 15, location: 10, salary: 5, keyword: 10 } });
  
  // Retrieve or compute ATS score
  const analyses = await findRecords("resumeAnalyses", { userId, resumeId: resume._id }, { limit: 1, sort: { createdAt: -1 } });
  const atsScore = analyses[0]?.atsScore || (await scoreResumeForRole(resume, job.title)).atsScore;
  
  // Compute composite apply readiness score
  const hasApplyUrl = Boolean(job.applyUrl);
  const applyReadinessScore = Math.min(100, Math.max(0, Math.round(
    (result.matchScore * 0.5) + (atsScore * 0.4) + (hasApplyUrl ? 10 : 0)
  )));

  return createRecord("jobMatches", {
    userId,
    jobId,
    resumeId: resume._id,
    ...result,
    applyReadinessScore
  });
}
