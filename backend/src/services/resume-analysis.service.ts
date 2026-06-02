import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById } from "../utils/repository.js";
import { scoreResumeAgainstJobDescription, scoreResumeForRole } from "./ats-scoring.service.js";
import { anonymizeResumeRecord } from "./resume-parser.service.js";

type AnalyzeResumeOptions = string | {
  targetRole?: string;
  jobDescription?: string;
  anonymizeForAnalysis?: boolean;
};

function mergeUnique(...groups: unknown[]) {
  return Array.from(new Set(groups.flatMap((group) => Array.isArray(group) ? group : []).filter(Boolean).map(String)));
}

function normalizeOptions(options: AnalyzeResumeOptions = "Full Stack Developer") {
  if (typeof options === "string") return { targetRole: options || "Full Stack Developer", jobDescription: "", anonymizeForAnalysis: false };
  return {
    targetRole: options.targetRole || "Full Stack Developer",
    jobDescription: options.jobDescription || "",
    anonymizeForAnalysis: Boolean(options.anonymizeForAnalysis)
  };
}

/** Compute a simple diff summary between base resume skills and improved skills. */
function computeChangeSummary(baseResume: any, tailoredContent: { skills?: string[]; summary?: string; projects?: any[] }) {
  const baseSkills: string[] = (baseResume?.parsedData?.skills || []).map((s: string) => String(s).toLowerCase());
  const newSkills: string[] = (tailoredContent.skills || []).map((s) => String(s).toLowerCase());
  const addedSkills = newSkills.filter((s) => !baseSkills.includes(s));
  const removedSkills = baseSkills.filter((s) => !newSkills.includes(s));
  const originalSummary = String(baseResume?.parsedData?.summary || "");
  const newSummary = String(tailoredContent.summary || "");
  const summaryChanged = newSummary.length > 0 && newSummary !== originalSummary;
  const projectsChanged = Boolean(tailoredContent.projects && tailoredContent.projects.length > 0);
  return { addedSkills, removedSkills, summaryChanged, projectsChanged };
}

export async function analyzeResume(userId: string, resumeId: string, options: AnalyzeResumeOptions = "Full Stack Developer") {
  const normalized = normalizeOptions(options);
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  const localScore = await scoreResumeForRole(resume, normalized.targetRole);
  const jobDescriptionCoverage = await scoreResumeAgainstJobDescription(resume, normalized.jobDescription);
  const resumeForAi = normalized.anonymizeForAnalysis ? anonymizeResumeRecord(resume) : resume;
  const analysis = await aiService.analyzeResume(userId, { resume: resumeForAi, targetRole: normalized.targetRole, jobDescription: normalized.jobDescription, localScore });
  const jdWeightedScore = jobDescriptionCoverage ? Math.round((localScore.atsScore * 0.75) + (jobDescriptionCoverage.coveragePercent * 0.25)) : localScore.atsScore;
  const atsScore = Math.round((Number(analysis.atsScore || jdWeightedScore) * 0.35) + (jdWeightedScore * 0.65));
  const redactedFields = normalized.anonymizeForAnalysis ? (resumeForAi as any).parsedData?.redactedFields || [] : [];
  return createRecord("resumeAnalyses", {
    userId,
    resumeId,
    targetRole: normalized.targetRole,
    ...analysis,
    atsScore,
    resumeLevel: localScore.resumeLevel,
    // v2 five-category breakdown
    categoryScores: localScore.categoryScores,
    scoreExplanation: localScore.scoreExplanation,
    sectionScores: { ...analysis.sectionScores, ...localScore.sectionScores },
    strengths: mergeUnique(localScore.strengths, analysis.strengths),
    weaknesses: mergeUnique(localScore.weaknesses, analysis.weaknesses),
    missingKeywords: mergeUnique(localScore.missingKeywords, jobDescriptionCoverage?.missingKeywords, analysis.missingKeywords),
    improvementSuggestions: mergeUnique(localScore.improvementSuggestions, jobDescriptionCoverage?.suggestions, analysis.improvementSuggestions),
    recruiterView: `${localScore.recruiterView} ${analysis.recruiterView || ""}`.trim(),
    roleKeywordBank: localScore.roleKeywordBank,
    keywordCoverage: localScore.keywordCoverage,
    atsBreakdown: localScore.atsBreakdown,
    jobDescriptionCoverage,
    privacyMode: normalized.anonymizeForAnalysis ? "anonymized_for_analysis" : "standard",
    redactedFields,
    parserWarnings: resume.parsedData?.parserWarnings || []
  });
}

export async function improveResume(userId: string, resumeId: string, targetRole = "Full Stack Developer") {
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  const tailored = await aiService.tailorResume(userId, { resume, targetRole });
  const content = {
    summary: tailored.updatedSummary,
    skills: tailored.updatedSkills,
    projects: tailored.improvedProjects,
    education: resume.parsedData?.education || [],
    certifications: resume.parsedData?.certifications || []
  };
  const changeSummary = computeChangeSummary(resume, content);
  return createRecord("resumeVersions", {
    userId,
    baseResumeId: resumeId,
    title: targetRole + " improved resume",
    targetRole,
    sourceType: "generated",
    template: "standard",
    content,
    atsScore: tailored.afterAtsScore,
    pdfUrl: tailored.pdfUrl,
    changeSummary
  });
}
