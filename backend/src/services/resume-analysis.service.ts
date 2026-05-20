import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById } from "../utils/repository.js";

export async function analyzeResume(userId: string, resumeId: string, targetRole = "Full Stack Developer") {
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  const analysis = await aiService.analyzeResume(userId, { resume, targetRole });
  return createRecord("resumeAnalyses", { userId, resumeId, targetRole, ...analysis });
}

export async function improveResume(userId: string, resumeId: string, targetRole = "Full Stack Developer") {
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  const tailored = await aiService.tailorResume(userId, { resume, targetRole });
  return createRecord("resumeVersions", {
    userId,
    baseResumeId: resumeId,
    title: targetRole + " improved resume",
    targetRole,
    content: {
      summary: tailored.updatedSummary,
      skills: tailored.updatedSkills,
      projects: tailored.improvedProjects,
      education: resume.parsedData?.education || [],
      certifications: resume.parsedData?.certifications || []
    },
    atsScore: tailored.afterAtsScore,
    pdfUrl: tailored.pdfUrl
  });
}
