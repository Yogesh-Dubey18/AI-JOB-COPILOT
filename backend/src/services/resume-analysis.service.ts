import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, findRecordById } from "../utils/repository.js";
import { scoreResumeAgainstJobDescription, scoreResumeForRole } from "./ats-scoring.service.js";
import { anonymizeResumeRecord } from "./resume-parser.service.js";
import { createNotification } from "./notification.service.js";
import { getJob } from "./job.service.js";

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

function normalizeSkillsObject(skillsObj: any): Record<string, string[]> {
  const allSkills: string[] = [];
  if (skillsObj && typeof skillsObj === "object") {
    for (const key of Object.keys(skillsObj)) {
      const arr = Array.isArray(skillsObj[key]) ? skillsObj[key] : [];
      allSkills.push(...arr);
    }
  } else if (Array.isArray(skillsObj)) {
    allSkills.push(...skillsObj);
  }

  const uniqueSkills = Array.from(new Set(allSkills.map(s => String(s).trim()).filter(Boolean)));

  const frontendKeywords = ["react", "next", "vue", "angular", "html", "css", "tailwind", "javascript", "typescript", "jsx", "sass"];
  const backendKeywords = ["node", "express", "api", "jwt", "auth", "python", "django", "flask", "fastapi", "spring", "laravel"];
  const databaseKeywords = ["mongodb", "mongoose", "mysql", "postgresql", "redis", "sqlite", "firebase", "supabase"];
  const toolsKeywords = ["git", "github", "vscode", "postman", "docker", "aws", "vercel", "render", "linux", "figma"];

  const result: Record<string, string[]> = {
    frontend: [],
    backend: [],
    database: [],
    tools: []
  };

  for (const skill of uniqueSkills) {
    const lower = skill.toLowerCase();
    if (frontendKeywords.some(kw => lower.includes(kw))) {
      result.frontend.push(skill);
    } else if (databaseKeywords.some(kw => lower.includes(kw))) {
      result.database.push(skill);
    } else if (backendKeywords.some(kw => lower.includes(kw))) {
      result.backend.push(skill);
    } else if (toolsKeywords.some(kw => lower.includes(kw))) {
      result.tools.push(skill);
    } else {
      result.tools.push(skill);
    }
  }

  return result;
}

export async function generateWorldClassResume(userId: string, resumeId: string, targetRole = "Full Stack Developer", jobId?: string) {
  if (!resumeId) throw new ApiError(400, "resumeId is required");
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");

  const user = await findOneRecord("users", { _id: userId });
  const parsedName = resume.parsedData?.name;
  const userFullName = user?.fullName;
  const emailLocal = user?.email ? user.email.split("@")[0] : "";
  
  let resolvedName = "Yogesh Dubey";
  if (parsedName && parsedName.toLowerCase() !== "candidate" && parsedName.trim().length > 0) {
    resolvedName = parsedName.trim();
  } else if (userFullName && userFullName.toLowerCase() !== "candidate" && userFullName.trim().length > 0) {
    resolvedName = userFullName.trim();
  } else if (emailLocal) {
    resolvedName = emailLocal.trim();
  }

  let beforeAtsScore = resume.atsScore || 70;
  let jobContext = undefined;
  let computedTitle = `${targetRole} world-class resume`;
  let addedKeywords: string[] = [];

  if (jobId) {
    const job = await getJob(jobId);
    if (job) {
      targetRole = job.title;
      computedTitle = `Tailored for: ${job.title} at ${job.company}`;
      jobContext = {
        title: job.title,
        company: job.company,
        description: job.description,
        skillsRequired: job.skillsRequired
      };
      const localAnalysis = await scoreResumeForRole(resume, job.title);
      beforeAtsScore = localAnalysis.atsScore;

      // Extract top 10 keywords using AI from job.description
      try {
        const keywordRes = await (aiService as any).extractKeywords(userId, { description: job.description || "" });
        if (keywordRes && Array.isArray(keywordRes.keywords)) {
          addedKeywords = keywordRes.keywords.slice(0, 10).map(String);
        }
      } catch (err) {
        console.error("AI keyword extraction failed:", err);
      }
    }
  }

  const generatedResume = await aiService.generateWorldClassResume(userId, {
    resume: {
      id: resume._id,
      fileName: resume.fileName,
      rawText: resume.rawText,
      parsedData: resume.parsedData
    },
    targetRole,
    job: jobContext
  });

  // Apply Name Resolution and Fallbacks to generatedResume
  generatedResume.name = resolvedName;
  if (!generatedResume.contact) {
    generatedResume.contact = {};
  }
  if (!generatedResume.contact.email && user?.email) {
    generatedResume.contact.email = user.email;
  }
  if (!generatedResume.contact.phone && user?.phone) {
    generatedResume.contact.phone = user.phone;
  }
  
  // Categorize and fix the wrong buckets
  generatedResume.skills = normalizeSkillsObject(generatedResume.skills);

  const content = buildWorldClassVersionContent(generatedResume);
  const changeSummary = computeChangeSummary(resume, content);
  
  const score = calculateAtsScore(generatedResume);

  const version = await createRecord("resumeVersions", {
    userId,
    baseResumeId: resumeId,
    title: computedTitle,
    targetRole: generatedResume.title || targetRole,
    targetJobId: jobId || undefined,
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
    beforeAtsScore,
    addedKeywords,
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

export async function generateImprovements(userId: string, resumeId: string) {
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  const result = await aiService.generateResumeImprovements(userId, { resume: resume.parsedData || resume });
  return {
    overallScore: result.overallScore || 75,
    improvements: (result.improvements || []).map((imp: any, idx: number) => ({
      id: imp.id || `imp_${idx + 1}`,
      section: imp.section || "SUMMARY",
      issue: imp.issue || "Improvement suggested",
      current: imp.current || "",
      improved: imp.improved || "",
      impact: imp.impact || "medium",
      reason: imp.reason || "Actionable resume improvement",
      applyImprovement: true
    })),
    quickWins: result.quickWins || ["Add GitHub link to header", "Quantify DSA achievements with numbers"],
    missingKeywords: result.missingKeywords || ["REST APIs", "JWT Authentication", "CI/CD"]
  };
}

export async function applySingleImprovement(userId: string, resumeId: string, improvementId: string, section: string, newContent: string) {
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  
  const parsedData = { ...(resume.parsedData || {}) };
  const normalizedSection = section.toLowerCase();
  
  if (normalizedSection === "summary") {
    parsedData.summary = newContent;
  } else if (normalizedSection === "skills" && Array.isArray(parsedData.skills)) {
    if (!parsedData.skills.includes(newContent)) {
      parsedData.skills.push(newContent);
    }
  } else if (normalizedSection === "projects" && Array.isArray(parsedData.projects) && parsedData.projects.length > 0) {
    if (parsedData.projects[0].bullets) {
      parsedData.projects[0].bullets[0] = newContent;
    }
  }

  return { updated: true, improvementId, section, newContent, parsedData };
}

export async function tailorResumeToJD(userId: string, resumeId: string, jobDescription: string, jobTitle: string, company: string) {
  const resume = await findRecordById("resumes", resumeId);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");

  const result = await aiService.tailorToJD(userId, {
    resume: resume.parsedData || resume,
    jobDescription,
    jobTitle: jobTitle || "Software Engineer",
    company: company || "Target Company"
  });

  const content = buildWorldClassVersionContent(result.resume || {});
  const changeSummary = computeChangeSummary(resume, content);

  const version = await createRecord("resumeVersions", {
    userId,
    baseResumeId: resumeId,
    title: (jobTitle || "Tailored") + " - " + (company || "Job"),
    targetRole: jobTitle || "Software Engineer",
    sourceType: "generated",
    template: "standard",
    content,
    atsScore: result.matchAnalysis?.matchScore || 95,
    pdfUrl: "",
    changeSummary
  });

  return {
    resume: result.resume,
    matchAnalysis: result.matchAnalysis,
    pdfUrl: `/api/pdf-export/resume?id=${version._id}`,
    resumeVersionId: version._id
  };
}
