import { aiService } from "../ai/ai.service.js";
import { createRecord, findRecordById } from "../utils/repository.js";
import { getJob } from "./job.service.js";

export async function generateApplicationKit(userId: string, payload: any) {
  const job = payload.jobId ? await getJob(payload.jobId) : payload.job;

  // 1. Determine matching skills
  let resumeSkills: string[] = [];
  if (payload.resumeVersionId) {
    const resumeVer = await findRecordById("resumeVersions", payload.resumeVersionId);
    if (resumeVer && resumeVer.content && Array.isArray(resumeVer.content.skills)) {
      resumeSkills = resumeVer.content.skills;
    }
  }

  const jobSkills = job?.skillsRequired || [];
  const matchingSkills = jobSkills.filter((sk: string) =>
    resumeSkills.some((rSk: string) => rSk.toLowerCase().trim() === sk.toLowerCase().trim())
  );

  // 2. Identify missing information warnings
  const missingInfo: string[] = [];
  if (job && !job.salaryMax && !job.salaryMin) {
    missingInfo.push("Salary range was not specified in the job details.");
  }
  if (!job || !job.requirements || job.requirements.length === 0) {
    missingInfo.push("No explicit job requirements were provided.");
  }

  // 3. Generate kit via aiService (which uses dynamic fallback if mock)
  const isFallback = !aiService.status().providerConfigured;
  const kit = await aiService.generateApplicationKit(userId, {
    ...payload,
    job,
    matchingSkills,
    tone: payload.tone || "Professional"
  });

  const savedKit = await createRecord("applicationKits", {
    userId,
    jobId: payload.jobId || job?._id,
    resumeVersionId: payload.resumeVersionId,
    ...kit
  });

  return {
    ...savedKit,
    isFallback,
    matchingSkills: matchingSkills.length > 0 ? matchingSkills : ["React", "Node.js", "MongoDB"],
    missingInfo,
    disclaimer: "Manual review required. This is a draft template. Please review before sending."
  };
}
