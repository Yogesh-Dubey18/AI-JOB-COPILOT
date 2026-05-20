import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById } from "../utils/repository.js";
import { scoreResumeForRole } from "./ats-scoring.service.js";

function mergeUnique(...groups: unknown[]) {
  return Array.from(new Set(groups.flatMap((group) => Array.isArray(group) ? group : []).filter(Boolean).map(String)));
}

export async function analyzeResume(userId: string, resumeId: string, targetRole = "Full Stack Developer") {
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  const localScore = scoreResumeForRole(resume, targetRole);
  const analysis = await aiService.analyzeResume(userId, { resume, targetRole, localScore });
  const atsScore = Math.round((Number(analysis.atsScore || localScore.atsScore) * 0.35) + (localScore.atsScore * 0.65));
  return createRecord("resumeAnalyses", {
    userId,
    resumeId,
    targetRole,
    ...analysis,
    atsScore,
    resumeLevel: localScore.resumeLevel,
    sectionScores: { ...analysis.sectionScores, ...localScore.sectionScores },
    strengths: mergeUnique(localScore.strengths, analysis.strengths),
    weaknesses: mergeUnique(localScore.weaknesses, analysis.weaknesses),
    missingKeywords: mergeUnique(localScore.missingKeywords, analysis.missingKeywords),
    improvementSuggestions: mergeUnique(localScore.improvementSuggestions, analysis.improvementSuggestions),
    recruiterView: `${localScore.recruiterView} ${analysis.recruiterView || ""}`.trim(),
    roleKeywordBank: localScore.roleKeywordBank,
    keywordCoverage: localScore.keywordCoverage,
    atsBreakdown: localScore.atsBreakdown,
    parserWarnings: resume.parsedData?.parserWarnings || []
  });
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
