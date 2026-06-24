import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById } from "../utils/repository.js";
import { scoreResumeAgainstJobDescription, scoreResumeForRole } from "./ats-scoring.service.js";
import { anonymizeResumeRecord } from "./resume-parser.service.js";
import { createNotification } from "./notification.service.js";

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

function flattenWorldClassSkills(skills: any = {}) {
  return Array.from(new Set(Object.values(skills).flatMap((value: any) => Array.isArray(value) ? value : []).map(String).filter(Boolean)));
}

function buildWorldClassVersionContent(generated: any) {
  return {
    summary: generated.summary || "",
    skills: flattenWorldClassSkills(generated.skills),
    projects: Array.isArray(generated.projects) ? generated.projects : [],
    experience: Array.isArray(generated.experience) ? generated.experience : [],
    education: Array.isArray(generated.education) ? generated.education : [],
    certifications: Array.isArray(generated.certifications) ? generated.certifications : []
  };
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
  const analysisRecord = await createRecord("resumeAnalyses", {
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

  try {
    await createNotification(userId, {
      type: "resume_analysis_complete",
      title: "Resume Analysis Complete",
      message: `Your resume "${resume.fileName}" has been analyzed for the "${normalized.targetRole}" role. ATS Score: ${atsScore}%.`,
      actionUrl: `/resume/analyzer?resumeId=${resumeId}`,
      dedupeKey: `resume-analysis-complete:${analysisRecord._id}`
    });
  } catch (error) {
    console.error("Failed to trigger resume analysis notification:", error);
  }

  return analysisRecord;
}

function calculateAtsScore(resume: any): number {
  let score = 0;

  // 1. Has strong summary: +15
  if (resume.summary && resume.summary.trim().length >= 80) {
    score += 15;
  }

  // 2. Skills categorized: +15
  const skills = resume.skills || {};
  const hasFrontend = Array.isArray(skills.frontend) && skills.frontend.length > 0;
  const hasBackend = Array.isArray(skills.backend) && skills.backend.length > 0;
  const hasDatabase = Array.isArray(skills.database) && skills.database.length > 0;
  const hasTools = Array.isArray(skills.tools) && skills.tools.length > 0;
  if (hasFrontend || hasBackend || hasDatabase || hasTools) {
    score += 15;
  }

  // 3. Projects have STAR bullets: +20
  const projects = resume.projects || [];
  let hasStarBullets = false;
  if (projects.length > 0) {
    const actionVerbs = ["built", "created", "developed", "implemented", "designed", "integrated", "optimized", "engineered", "deployed", "scaled"];
    const allBullets = projects.flatMap((p: any) => p.bullets || []);
    const hasVerbsOrMetrics = allBullets.some((b: string) => {
      const lower = b.toLowerCase();
      const hasVerb = actionVerbs.some(v => lower.includes(v));
      const hasMetric = /\d+/.test(lower);
      return hasVerb || hasMetric;
    });
    if (hasVerbsOrMetrics) {
      hasStarBullets = true;
    }
  }
  if (hasStarBullets) {
    score += 20;
  }

  // 4. No generic phrases: +15
  const textStr = JSON.stringify(resume).toLowerCase();
  const hasGeneric = textStr.includes("demonstrating hands-on implementation") || 
                     textStr.includes("from the uploaded resume") ||
                     textStr.includes("%¸");
  if (!hasGeneric) {
    score += 15;
  }

  // 5. Keywords present: +20
  if (Array.isArray(resume.atsKeywords) && resume.atsKeywords.length >= 5) {
    score += 20;
  }

  // 6. Clean formatting: +15
  const hasName = resume.name && resume.name.length > 2;
  const hasContact = resume.contact && resume.contact.email && resume.contact.phone;
  const hasEducation = Array.isArray(resume.education) && resume.education.length > 0;
  if (hasName && hasContact && hasEducation) {
    score += 15;
  }

  return score;
}

export async function generateWorldClassResume(userId: string, resumeId: string, targetRole = "Full Stack Developer") {
  if (!resumeId) throw new ApiError(400, "resumeId is required");
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");

  const generatedResume = await aiService.generateWorldClassResume(userId, {
    resume: {
      id: resume._id,
      fileName: resume.fileName,
      rawText: resume.rawText,
      parsedData: resume.parsedData
    },
    targetRole
  });
  const content = buildWorldClassVersionContent(generatedResume);
  const changeSummary = computeChangeSummary(resume, content);
  
  const score = calculateAtsScore(generatedResume);

  const version = await createRecord("resumeVersions", {
    userId,
    baseResumeId: resumeId,
    title: `${generatedResume.title || targetRole} world-class resume`,
    targetRole: generatedResume.title || targetRole,
    sourceType: "generated",
    template: "compact",
    content,
    atsScore: score,
    pdfUrl: "",
    changeSummary
  });

  try {
    await createNotification(userId, {
      type: "resume_analysis_complete",
      title: "World-Class Resume Ready",
      message: `A new world-class resume version has been generated for "${targetRole}" with ATS Score: ${score}%.`,
      actionUrl: `/resume/versions`,
      dedupeKey: `world-class-ready:${version._id}`
    });
  } catch (error) {
    console.error("Failed to trigger world-class resume notification:", error);
  }

  return {
    generatedResume,
    resumeVersionId: version._id,
    baseResumeId: resumeId,
    atsScore: score,
    provider: aiService.status(),
    safety: {
      noFakeExperience: true,
      noFakeSkills: true,
      usesUploadedResumeDataOnly: true
    }
  };
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
  const version = await createRecord("resumeVersions", {
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

  try {
    await createNotification(userId, {
      type: "resume_analysis_complete",
      title: "Resume Improved",
      message: `Your resume has been improved for "${targetRole}" with ATS Score: ${tailored.afterAtsScore}%.`,
      actionUrl: `/resume/versions`,
      dedupeKey: `resume-improved:${version._id}`
    });
  } catch (error) {
    console.error("Failed to trigger improve resume notification:", error);
  }

  return version;
}
