import { aiService } from "../ai/ai.service.js";
import { createRecord, findRecordById, findRecords } from "../utils/repository.js";
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

  // 2b. Fetch the user's saved Answer Vault entries (STAR-style answers).
  // These are real, verified answers the candidate wrote themselves and
  // should be preferred over AI-invented examples wherever relevant.
  const answerVaultEntries = await findRecords("answerVault", { userId }, { limit: 30, sort: { createdAt: -1 } });
  const savedAnswers = answerVaultEntries.map((entry: any) => ({
    category: entry.category || "General",
    question: entry.question || "",
    answer: entry.answer || "",
    tags: Array.isArray(entry.tags) ? entry.tags : []
  })).filter((entry: any) => entry.question && entry.answer);

  // 3. Generate kit via aiService (which uses dynamic fallback if mock)
  const isFallback = !aiService.status().providerConfigured;
  const kit = await aiService.generateApplicationKit(userId, {
    ...payload,
    job,
    matchingSkills,
    savedAnswers,
    tone: payload.tone || "Professional"
  });

  const savedKit = await createRecord("applicationKits", {
    userId,
    jobId: payload.jobId || job?._id,
    resumeVersionId: payload.resumeVersionId,
    usedSavedAnswers: savedAnswers.length > 0,
    ...kit
  });

  return {
    ...savedKit,
    isFallback,
    matchingSkills: matchingSkills.length > 0 ? matchingSkills : ["React", "Node.js", "MongoDB"],
    missingInfo,
    usedSavedAnswers: savedAnswers.length > 0,
    savedAnswersCount: savedAnswers.length,
    disclaimer: "Manual review required. This is a draft template. Please review before sending."
  };
}

