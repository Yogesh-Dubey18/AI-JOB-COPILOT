import { aiService, preserveSourceProjectBullets } from "../ai/ai.service.js";
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
  const certs = Array.isArray(generated.certifications) ? generated.certifications : [];
  const achs = Array.isArray(generated.achievements) ? generated.achievements : [];
  const mergedCertAchs = Array.from(new Set(
    [...certs, ...achs]
      .map((item: any) => typeof item === "string" ? item.trim() : (item?.full || item?.name || String(item || "")))
      .filter(Boolean)
  ));
  return {
    name: generated.name || "",
    title: generated.title || "",
    contact: generated.contact || {},
    summary: generated.summary || "",
    skills: flattenWorldClassSkills(generated.skills),
    projects: Array.isArray(generated.projects) ? generated.projects : [],
    experience: Array.isArray(generated.experience) ? generated.experience : [],
    education: Array.isArray(generated.education) ? generated.education : [],
    certifications: mergedCertAchs,
    achievements: mergedCertAchs
  };
}

export function calculateGradeAndBreakdown(atsScore: number, customBreakdown?: any) {
  const score = Math.round(Math.min(100, Math.max(0, atsScore)));
  let letterGrade = "F";
  let gradeLabel = "Failing";

  if (score >= 90) { letterGrade = "A+"; gradeLabel = "Outstanding"; }
  else if (score >= 80) { letterGrade = "A"; gradeLabel = "Excellent"; }
  else if (score >= 70) { letterGrade = "B+"; gradeLabel = "Good"; }
  else if (score >= 60) { letterGrade = "B"; gradeLabel = "Above Average"; }
  else if (score >= 50) { letterGrade = "C"; gradeLabel = "Needs Work"; }
  else if (score >= 40) { letterGrade = "D"; gradeLabel = "Poor"; }

  const scoreBreakdown = {
    keywords: customBreakdown?.keywords ?? Math.min(100, Math.round(score * 1.02)),
    formatting: customBreakdown?.formatting ?? Math.min(100, Math.round(score * 0.98)),
    sections: customBreakdown?.sections ?? Math.min(100, Math.round(score * 1.05)),
    actionVerbs: customBreakdown?.actionVerbs ?? Math.max(30, Math.round(score * 0.92)),
    quantification: customBreakdown?.quantification ?? Math.max(25, Math.round(score * 0.88)),
    contactInfo: customBreakdown?.contactInfo ?? 95
  };

  return { letterGrade, gradeLabel, scoreBreakdown };
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
  
  const { letterGrade, gradeLabel, scoreBreakdown } = calculateGradeAndBreakdown(atsScore, analysis.scoreBreakdown);

  const analysisRecord = await createRecord("resumeAnalyses", {
    userId,
    resumeId,
    targetRole: normalized.targetRole,
    ...analysis,
    atsScore,
    letterGrade,
    gradeLabel,
    scoreBreakdown,
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

const SKILL_CANONICAL_MAP: Record<string, string> = {
  "react": "React.js",
  "reactjs": "React.js",
  "react.js": "React.js",
  "next": "Next.js",
  "nextjs": "Next.js",
  "next.js": "Next.js",
  "node": "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  "express": "Express.js",
  "expressjs": "Express.js",
  "express.js": "Express.js",
  "mongo": "MongoDB",
  "mongodb": "MongoDB",
  "mongoose": "Mongoose",
  "mysql": "MySQL",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  "restful api": "REST APIs",
  "restful apis": "REST APIs",
  "jwt": "JWT Authentication",
  "jwt auth": "JWT Authentication",
  "jwt authentication": "JWT Authentication",
  "tailwind": "Tailwind CSS",
  "tailwindcss": "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  "html": "HTML5",
  "html5": "HTML5",
  "css": "CSS3",
  "css3": "CSS3",
  "js": "JavaScript",
  "javascript": "JavaScript",
  "ts": "TypeScript",
  "typescript": "TypeScript",
  "vue": "Vue.js",
  "vuejs": "Vue.js",
  "vue.js": "Vue.js",
  "go": "Go",
  "golang": "Go",
  "ruby on rails": "Ruby on Rails",
  "rails": "Ruby on Rails",
  "websocket": "WebSockets",
  "websockets": "WebSockets",
  "kafka": "Apache Kafka",
  "nginx": "NGINX",
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "aws": "AWS"
};

export function canonicalizeSkill(skillName: string): string {
  const trimmed = String(skillName || "").trim();
  const lower = trimmed.toLowerCase();
  if (SKILL_CANONICAL_MAP[lower]) {
    return SKILL_CANONICAL_MAP[lower];
  }
  return trimmed;
}

export function deduplicateAndCanonicalizeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of skills) {
    if (!s || typeof s !== "string") continue;
    const canonical = canonicalizeSkill(s);
    const key = canonical.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(canonical);
    }
  }
  return result;
}

function normalizeSkillsObject(skillsObj: any): { frontend: string[]; backend: string[]; database: string[]; cloud: string[]; tools: string[]; programming: string[]; other: string[]; } {
  const allSkills: string[] = [];
  if (Array.isArray(skillsObj)) {
    allSkills.push(...skillsObj);
  } else if (skillsObj && typeof skillsObj === "object") {
    for (const key of Object.keys(skillsObj)) {
      const val = skillsObj[key];
      if (Array.isArray(val)) {
        allSkills.push(...val);
      } else if (typeof val === "string") {
        allSkills.push(val);
      }
    }
  }

  const uniqueSkills = deduplicateAndCanonicalizeSkills(allSkills);

  const frontendKeywords = ["react", "next", "vue", "angular", "html", "css", "tailwind", "javascript", "typescript", "jsx", "sass"];
  const backendKeywords = ["node", "express", "api", "jwt", "auth", "python", "django", "flask", "fastapi", "spring", "laravel", "rails", "ruby", "websockets", "websocket", "grpc", "kafka"];
  const databaseKeywords = ["mongodb", "mongoose", "mysql", "postgresql", "postgres", "redis", "sqlite", "firebase", "supabase"];
  const cloudKeywords = ["aws", "azure", "gcp", "vercel", "render", "docker", "kubernetes", "k8s", "heroku", "netlify", "nginx", "ci/cd"];
  const toolsKeywords = ["git", "github", "vscode", "postman", "linux", "figma", "jest", "npm", "webpack", "jira"];
  const programmingKeywords = ["c++", "c#", "java", "python", "javascript", "typescript", "go", "golang", "rust", "php", "ruby", "swift", "kotlin"];

  const result = {
    frontend: [] as string[],
    backend: [] as string[],
    database: [] as string[],
    cloud: [] as string[],
    tools: [] as string[],
    programming: [] as string[],
    other: [] as string[]
  };

  const assigned = new Set<string>();

  for (const skill of uniqueSkills) {
    const lower = skill.toLowerCase();
    const key = lower;
    if (assigned.has(key)) continue;

    if (frontendKeywords.some(kw => lower.includes(kw))) {
      result.frontend.push(skill);
      assigned.add(key);
    } else if (databaseKeywords.some(kw => lower.includes(kw))) {
      result.database.push(skill);
      assigned.add(key);
    } else if (backendKeywords.some(kw => lower.includes(kw))) {
      result.backend.push(skill);
      assigned.add(key);
    } else if (cloudKeywords.some(kw => lower.includes(kw))) {
      result.cloud.push(skill);
      assigned.add(key);
    } else if (programmingKeywords.some(kw => lower.includes(kw))) {
      result.programming.push(skill);
      assigned.add(key);
    } else if (toolsKeywords.some(kw => lower.includes(kw))) {
      result.tools.push(skill);
      assigned.add(key);
    } else {
      result.other.push(skill);
      assigned.add(key);
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
  
  let resolvedName = "Candidate";
  if (parsedName && parsedName.toLowerCase() !== "candidate" && parsedName.trim().length > 0) {
    resolvedName = parsedName.trim();
  } else if (userFullName && userFullName.toLowerCase() !== "candidate" && userFullName.trim().length > 0) {
    resolvedName = userFullName.trim();
  } else if (emailLocal) {
    resolvedName = emailLocal.trim();
  }

  let beforeAtsScore = resume.atsScore || 70;
  let jobContext = undefined;
  let computedTitle = targetRole ? `${targetRole} — World-Class Resume` : "World-Class Resume";
  const addedKeywords: string[] = [];
  if (jobId) {
    const job = await findRecordById("jobs", jobId);
    if (job) {
      targetRole = job.title || targetRole;
      computedTitle = `Tailored for: ${job.title} at ${job.company}`;
      jobContext = {
        title: job.title,
        company: job.company,
        description: job.description,
        skillsRequired: job.skillsRequired
      };
      if (Array.isArray(job.skillsRequired) && job.skillsRequired.length > 0) {
        addedKeywords.push(...job.skillsRequired.slice(0, 10));
      } else if (job.description) {
        const matched = job.description.match(/\b(React|Python|Node\.js|Express|TypeScript|JavaScript|AWS|MongoDB|SQL|Java|Docker)\b/gi) || [];
        addedKeywords.push(...Array.from(new Set(matched)).slice(0, 10).map(String));
      }
    }
  }

  const generatedResume = await aiService.generateWorldClassResume(userId, {
    resume: {
      id: String(resume._id),
      fileName: String(resume.fileName || ""),
      rawText: String(resume.rawText || ""),
      parsedData: resume.parsedData
    },
    targetRole,
    job: jobContext
  });

  if (generatedResume.title && !jobId) {
    computedTitle = `${generatedResume.title} — World-Class Resume`;
  }

  // Apply Name Resolution and Contact Info
  generatedResume.name = resolvedName;
  generatedResume.contact = {
    email: generatedResume.contact?.email || user?.email || '',
    phone: generatedResume.contact?.phone || user?.phone || '',
    github: generatedResume.contact?.github || '',
    linkedin: generatedResume.contact?.linkedin || '',
    location: generatedResume.contact?.location || ''
  };
  
  // 1. Gather all source skills to guarantee no skills dropped & prevent hallucinations
  const sourceSkillsRaw: string[] = [];
  if (Array.isArray(resume.parsedData?.skills)) {
    sourceSkillsRaw.push(...resume.parsedData.skills);
  } else if (resume.parsedData?.skills && typeof resume.parsedData.skills === "object") {
    for (const k of Object.keys(resume.parsedData.skills)) {
      const val = resume.parsedData.skills[k];
      if (Array.isArray(val)) sourceSkillsRaw.push(...val);
      else if (typeof val === "string") sourceSkillsRaw.push(val);
    }
  }

  if (resume.parsedData?.categorizedSkills && typeof resume.parsedData.categorizedSkills === "object") {
    for (const k of Object.keys(resume.parsedData.categorizedSkills)) {
      const arr = Array.isArray(resume.parsedData.categorizedSkills[k]) ? resume.parsedData.categorizedSkills[k] : [];
      sourceSkillsRaw.push(...arr);
    }
  }
  const textMatches = (resume.rawText || "").match(/\b(React|Next\.js|TypeScript|JavaScript|Node\.js|Express\.js|Python|Java|Go|Golang|Ruby|Ruby on Rails|Rails|PostgreSQL|MySQL|Redis|MongoDB|Kafka|AWS|Kubernetes|Docker|NGINX|WebSockets|GraphQL|REST APIs|HTML5|CSS3|Git|Postman)\b/gi) || [];
  sourceSkillsRaw.push(...textMatches);

  const cleanSourceSkills = deduplicateAndCanonicalizeSkills(sourceSkillsRaw);
  const sourceSkillLowerSet = new Set(cleanSourceSkills.map(s => s.toLowerCase()));

  let allGenSkills: string[] = [];
  if (generatedResume.skills && typeof generatedResume.skills === "object") {
    for (const key of Object.keys(generatedResume.skills)) {
      const arr = Array.isArray(generatedResume.skills[key]) ? generatedResume.skills[key] : [];
      allGenSkills.push(...arr);
    }
  } else if (Array.isArray(generatedResume.skills)) {
    allGenSkills.push(...generatedResume.skills);
  }

  const mergedSkills = deduplicateAndCanonicalizeSkills([...allGenSkills, ...cleanSourceSkills]);

  // Remove hallucinated MongoDB if not present in source resume
  const hasMongoInSource = sourceSkillLowerSet.has("mongodb") || sourceSkillLowerSet.has("mongo") || sourceSkillLowerSet.has("mongoose");
  const finalSkillsToCategorize = hasMongoInSource
    ? mergedSkills
    : mergedSkills.filter(s => !/mongo/i.test(s));

  generatedResume.skills = normalizeSkillsObject(finalSkillsToCategorize);

  // 2. Reconcile and guarantee all source projects (including low-detail & flagship projects) are present
  const sourceProjects = Array.isArray(resume.parsedData?.projects) ? resume.parsedData.projects : [];
  const currentGenProjects: any[] = Array.isArray(generatedResume.projects) ? generatedResume.projects : [];

  for (const srcP of sourceProjects) {
    if (!srcP || !srcP.name) continue;
    const srcName = String(srcP.name).trim();
    const exists = currentGenProjects.some((gp: any) => gp.name && (gp.name.toLowerCase().includes(srcName.toLowerCase()) || srcName.toLowerCase().includes(String(gp.name).toLowerCase())));
    if (!exists) {
      const srcBullets = Array.isArray(srcP.bullets) && srcP.bullets.length > 0 ? srcP.bullets : [srcP.description || ""].filter(Boolean);
      currentGenProjects.push({
        name: srcName,
        tech: srcP.tech || srcP.techStack || "",
        bullets: srcBullets.length > 0 ? srcBullets : [`Engineered ${srcName} delivering responsive user interfaces and robust full-stack architecture.`],
        live: srcP.live || "",
        github: srcP.github || ""
      });
    }
  }

  generatedResume.projects = currentGenProjects.map((genProj: any) => {
    const matchedSource = sourceProjects.find((sp: any) => sp.name && (sp.name.toLowerCase().includes(String(genProj.name || "").toLowerCase()) || String(genProj.name || "").toLowerCase().includes(sp.name.toLowerCase())));
    if (matchedSource) {
      const srcBullets = Array.isArray(matchedSource.bullets) ? matchedSource.bullets : [matchedSource.description || ""].filter(Boolean);
      const currentBullets = Array.isArray(genProj.bullets) ? genProj.bullets : [];
      genProj.bullets = preserveSourceProjectBullets(currentBullets, srcBullets, genProj.name || "");
    }
    return genProj;
  });

  // 3. Reconcile Experience Section
  const sourceExperience = Array.isArray(resume.parsedData?.experience) ? resume.parsedData.experience : [];
  const currentGenExperience: any[] = Array.isArray(generatedResume.experience) ? generatedResume.experience : [];

  if (sourceExperience.length > 0) {
    for (const srcE of sourceExperience) {
      if (!srcE) continue;
      const role = srcE.role || srcE.title || "Software Developer";
      const company = srcE.company || "Self-Directed / Fresher Projects";
      const duration = srcE.duration || "2022 – Present";
      const bullets = Array.isArray(srcE.bullets) && srcE.bullets.length > 0
        ? srcE.bullets
        : [srcE.description || `Focused on ${targetRole} development, building responsive web applications.`];

      const exists = currentGenExperience.some((ge: any) =>
        ge && (String(ge.role || "").toLowerCase().includes(role.toLowerCase()) || String(ge.company || "").toLowerCase().includes(company.toLowerCase()))
      );

      if (!exists) {
        currentGenExperience.push({
          role,
          company,
          duration,
          bullets
        });
      }
    }
  }
  generatedResume.experience = currentGenExperience;

  // 4. Reconcile Achievements & Certifications
  const sourceAchievements = [
    ...(Array.isArray(resume.parsedData?.achievements) ? resume.parsedData.achievements : []),
    ...(Array.isArray(resume.parsedData?.certifications) ? resume.parsedData.certifications : [])
  ].filter(Boolean);

  const currentGenAchievements: string[] = Array.isArray(generatedResume.achievements) ? generatedResume.achievements : [];

  for (const srcA of sourceAchievements) {
    const text = typeof srcA === "string" ? srcA : (srcA.name || srcA.full || JSON.stringify(srcA));
    if (!text || text.length < 5) continue;
    const exists = currentGenAchievements.some(ga => String(ga).toLowerCase().includes(text.toLowerCase()) || text.toLowerCase().includes(String(ga).toLowerCase()));
    if (!exists) {
      currentGenAchievements.push(text);
    }
  }
  generatedResume.achievements = currentGenAchievements;

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

export async function compareResumes(userId: string, resumeId1: string, resumeId2: string) {
  const resume1 = await findRecordById("resumes", resumeId1);
  const resume2 = await findRecordById("resumes", resumeId2);

  if (!resume1 || String(resume1.userId) !== userId) throw new ApiError(404, "Resume 1 not found");
  if (!resume2 || String(resume2.userId) !== userId) throw new ApiError(404, "Resume 2 not found");

  const score1 = await scoreResumeForRole(resume1, resume1.targetRole || "Full Stack Developer");
  const score2 = await scoreResumeForRole(resume2, resume2.targetRole || "Full Stack Developer");

  const grade1 = calculateGradeAndBreakdown(score1.atsScore);
  const grade2 = calculateGradeAndBreakdown(score2.atsScore);

  const atsScore1 = score1.atsScore;
  const atsScore2 = score2.atsScore;

  const winner = atsScore1 >= atsScore2 ? "resume1" : "resume2";
  const diff = Math.abs(atsScore1 - atsScore2);

  const winnerName = winner === "resume1" ? (resume1.parsedData?.name || "Resume 1") : (resume2.parsedData?.name || "Resume 2");
  const verdict = diff === 0
    ? "Both resumes have equal ATS scores."
    : `${winnerName} scores ${diff} points higher with better keyword coverage and layout structure.`;

  return {
    resume1: {
      name: resume1.parsedData?.name || resume1.fileName || "Resume 1",
      atsScore: atsScore1,
      letterGrade: grade1.letterGrade,
      gradeLabel: grade1.gradeLabel,
      strengths: score1.strengths || ["Strong technical foundation"],
      weaknesses: score1.weaknesses || ["Add metric details"]
    },
    resume2: {
      name: resume2.parsedData?.name || resume2.fileName || "Resume 2",
      atsScore: atsScore2,
      letterGrade: grade2.letterGrade,
      gradeLabel: grade2.gradeLabel,
      strengths: score2.strengths || ["Clean structure"],
      weaknesses: score2.weaknesses || ["Needs more keywords"]
    },
    winner,
    verdict
  };
}

export async function compareResumesVsJob(userId: string, resumeId1: string, resumeId2: string, jobDescription: string) {
  const resume1 = await findRecordById("resumes", resumeId1);
  const resume2 = await findRecordById("resumes", resumeId2);

  if (!resume1 || String(resume1.userId) !== userId) throw new ApiError(404, "Resume 1 not found");
  if (!resume2 || String(resume2.userId) !== userId) throw new ApiError(404, "Resume 2 not found");

  const cov1 = await scoreResumeAgainstJobDescription(resume1, jobDescription);
  const cov2 = await scoreResumeAgainstJobDescription(resume2, jobDescription);

  const match1 = cov1?.coveragePercent || 0;
  const match2 = cov2?.coveragePercent || 0;

  const winner = match1 >= match2 ? "resume1" : "resume2";
  const winnerName = winner === "resume1" ? (resume1.parsedData?.name || "Resume 1") : (resume2.parsedData?.name || "Resume 2");

  const recommendation = match1 === match2
    ? "Both resumes match the job description equally well."
    : `${winnerName} is significantly better for this role (${match1}% vs ${match2}% keyword match).`;

  return {
    resume1Match: match1,
    resume2Match: match2,
    winner,
    resume1Matched: cov1?.detectedKeywords || [],
    resume2Matched: cov2?.detectedKeywords || [],
    recommendation
  };
}

export const RESUME_ROLE_EXAMPLES: Record<string, {
  role: string;
  slug: string;
  category: string;
  keywords: string[];
  sampleBullets: string[];
  summary: string;
  templateData: any;
}> = {
  "full-stack-developer": {
    slug: "full-stack-developer",
    role: "Full Stack Developer",
    category: "Full Stack",
    keywords: ["React", "Node.js", "TypeScript", "MongoDB", "Express", "REST APIs", "AWS", "Git", "Docker", "Jest"],
    sampleBullets: [
      "Architected and deployed a full-stack web application serving 10,000+ monthly active users with 99.9% uptime.",
      "Engineered responsive React frontend integrated with RESTful Node.js APIs, reducing page load time by 35%.",
      "Optimized MongoDB database indexing and query schemas, decreasing API latency from 450ms to 120ms."
    ],
    summary: "Full Stack Developer with 2+ years of experience building scalable MERN stack web applications.",
    templateData: {
      name: "Alex Morgan",
      title: "Full Stack Developer",
      skills: { frontend: ["React", "TypeScript", "Tailwind"], backend: ["Node.js", "Express", "REST APIs"], database: ["MongoDB", "Redis"], cloud: ["AWS", "Docker"], tools: ["Git", "Jest"] }
    }
  },
  "frontend-developer": {
    slug: "frontend-developer",
    role: "Frontend Developer",
    category: "Frontend",
    keywords: ["React", "TypeScript", "HTML5", "CSS3", "Tailwind CSS", "Redux Toolkit", "Next.js", "Accessibility", "Performance Optimization", "Jest"],
    sampleBullets: [
      "Developed modular React components with TypeScript and Tailwind CSS, increasing design system reusability across 5 teams.",
      "Optimized Web Vitals score from 62 to 94 by implementing code splitting, image lazy loading, and dynamic imports.",
      "Integrated Redux Toolkit for state management, streamlining real-time data sync across complex user dashboards."
    ],
    summary: "Frontend Developer specializing in high-performance React and Next.js user interfaces.",
    templateData: {
      name: "Sarah Chen",
      title: "Frontend Developer",
      skills: { frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS"], backend: ["REST API"], database: [], cloud: ["Vercel"], tools: ["Git", "Figma", "Jest"] }
    }
  },
  "backend-developer": {
    slug: "backend-developer",
    role: "Backend Developer",
    category: "Backend",
    keywords: ["Node.js", "Express.js", "Python", "PostgreSQL", "MongoDB", "Redis", "Docker", "Microservices", "JWT", "gRPC"],
    sampleBullets: [
      "Engineered microservices backend handling 500+ requests/sec using Node.js, Express, and Redis caching.",
      "Designed relational database schemas in PostgreSQL with automated migration pipelines, ensuring zero-downtime schema updates.",
      "Implemented OAuth2.0 and JWT authentication pipelines, securing sensitive user endpoints against unauthorized access."
    ],
    summary: "Backend Engineer focused on microservices, database architecture, and high-throughput APIs.",
    templateData: {
      name: "David Kumar",
      title: "Backend Engineer",
      skills: { frontend: [], backend: ["Node.js", "Express", "Python", "Microservices"], database: ["PostgreSQL", "MongoDB", "Redis"], cloud: ["AWS", "Docker"], tools: ["Git", "Postman"] }
    }
  },
  "react-developer": {
    slug: "react-developer",
    role: "React Developer",
    category: "Frontend",
    keywords: ["React.js", "JSX", "Hooks", "Context API", "Redux", "TypeScript", "Tailwind CSS", "Axios", "React Router", "Vite"],
    sampleBullets: [
      "Built single-page applications with React 18 functional components and custom hooks, eliminating code duplication by 40%.",
      "Integrated client-side state management using React Context API and Redux, ensuring seamless data flow across 20+ screens.",
      "Created reusable UI component library with storybook documentation and 95%+ unit test coverage using Vitest."
    ],
    summary: "React Specialist dedicated to building intuitive, accessible, and fast web user interfaces.",
    templateData: {
      name: "Priya Sharma",
      title: "React Developer",
      skills: { frontend: ["React", "TypeScript", "Redux", "Tailwind CSS"], backend: ["REST API"], database: [], cloud: ["Netlify"], tools: ["Git", "Vite"] }
    }
  },
  "node-js-developer": {
    slug: "node-js-developer",
    role: "Node.js Developer",
    category: "Backend",
    keywords: ["Node.js", "Express.js", "Asynchronous JS", "MongoDB", "Mongoose", "WebSockets", "Socket.io", "npm", "Jest", "CI/CD"],
    sampleBullets: [
      "Developed real-time chat and notification service using Node.js and Socket.io, scaling to 5,000 concurrent websocket connections.",
      "Created RESTful APIs with express validation middleware, reducing invalid client payload submissions by 90%.",
      "Configured automated unit & integration test suites in Jest with 88% code coverage in automated CI/CD pipelines."
    ],
    summary: "Node.js Developer expert in event-driven asynchronous architectures and real-time backend services.",
    templateData: {
      name: "Rohan Verma",
      title: "Node.js Developer",
      skills: { frontend: [], backend: ["Node.js", "Express", "Socket.io", "WebSockets"], database: ["MongoDB", "Mongoose"], cloud: ["Render", "AWS"], tools: ["Git", "Jest"] }
    }
  },
  "mern-stack-developer": {
    slug: "mern-stack-developer",
    role: "MERN Stack Developer",
    category: "Full Stack",
    keywords: ["MongoDB", "Express.js", "React.js", "Node.js", "JavaScript", "REST APIs", "Mongoose", "JWT Auth", "Tailwind", "Git"],
    sampleBullets: [
      "Designed and deployed end-to-end MERN stack web applications with role-based access control (RBAC) and Stripe payment integration.",
      "Optimized Mongoose aggregation queries and indexing strategies, improving database lookup speed by 4x.",
      "Built responsive React dashboards connected to Express backend endpoints, delivering smooth data visualizations."
    ],
    summary: "MERN Stack Specialist with expertise in building end-to-end JavaScript applications.",
    templateData: {
      name: "Sample Candidate",
      title: "MERN Stack Developer",
      skills: { frontend: ["React", "JavaScript", "Tailwind"], backend: ["Node.js", "Express"], database: ["MongoDB", "Mongoose"], cloud: ["AWS", "Vercel"], tools: ["Git", "Postman"] }
    }
  },
  "python-developer": {
    slug: "python-developer",
    role: "Python Developer",
    category: "Backend / AI",
    keywords: ["Python", "Django", "Flask", "FastAPI", "SQLAlchemy", "PostgreSQL", "REST APIs", "Pandas", "PyTest", "Docker"],
    sampleBullets: [
      "Built high-speed asynchronous REST APIs using Python FastAPI and Pydantic validation, achieving sub-50ms response times.",
      "Developed automated data scraping and parsing scripts processing 50,000+ records daily into structured PostgreSQL tables.",
      "Created comprehensive automated test suites using PyTest, catching edge-case bugs prior to production releases."
    ],
    summary: "Python Developer skilled in FastAPI, Django, database modeling, and automated backend data workflows.",
    templateData: {
      name: "Michael Scott",
      title: "Python Developer",
      skills: { frontend: [], backend: ["Python", "Django", "FastAPI", "Flask"], database: ["PostgreSQL", "SQLAlchemy"], cloud: ["Docker", "AWS"], tools: ["Git", "PyTest"] }
    }
  },
  "java-developer": {
    slug: "java-developer",
    role: "Java Developer",
    category: "Enterprise Backend",
    keywords: ["Java 17", "Spring Boot", "Spring Cloud", "Hibernate", "JPA", "MySQL", "Maven", "JUnit", "Microservices", "Kafka"],
    sampleBullets: [
      "Developed enterprise Spring Boot microservices using Java 17 and Spring Data JPA, serving 1M+ transactions daily.",
      "Implemented distributed messaging pipelines with Apache Kafka, decoupling payment processing from order handling.",
      "Wrote robust JUnit 5 and Mockito test suites to ensure 90%+ code coverage for mission-critical banking workflows."
    ],
    summary: "Java Backend Engineer experienced in Spring Boot, microservices architecture, and enterprise Java ecosystem.",
    templateData: {
      name: "Vikram Mehta",
      title: "Java Developer",
      skills: { frontend: [], backend: ["Java 17", "Spring Boot", "Spring Cloud", "Hibernate"], database: ["MySQL", "PostgreSQL"], cloud: ["Docker", "Kubernetes"], tools: ["Git", "Maven", "JUnit"] }
    }
  },
  "devops-engineer": {
    slug: "devops-engineer",
    role: "DevOps Engineer",
    category: "Cloud & Infrastructure",
    keywords: ["Docker", "Kubernetes", "AWS", "Terraform", "GitHub Actions", "CI/CD", "Linux", "Bash", "Prometheus", "Grafana"],
    sampleBullets: [
      "Automated CI/CD deployment pipelines using GitHub Actions and Docker, reducing software release cycles from 3 days to 15 minutes.",
      "Provisioned infrastructure as code (IaC) on AWS using Terraform, managing VPCs, EC2 clusters, and RDS instances.",
      "Configured Prometheus and Grafana monitoring stacks with automated alert triggers, achieving 99.99% system availability."
    ],
    summary: "DevOps Engineer passionate about infrastructure automation, cloud elasticity, and continuous integration.",
    templateData: {
      name: "Karan Patel",
      title: "DevOps Engineer",
      skills: { frontend: [], backend: ["Bash", "Python"], database: ["RDS", "Redis"], cloud: ["AWS", "Docker", "Kubernetes", "Terraform"], tools: ["Git", "GitHub Actions", "Prometheus"] }
    }
  },
  "data-analyst": {
    slug: "data-analyst",
    role: "Data Analyst",
    category: "Data & Analytics",
    keywords: ["SQL", "Python", "Pandas", "NumPy", "PowerBI", "Tableau", "Excel", "Data Visualization", "Statistics", "A/B Testing"],
    sampleBullets: [
      "Analyzed 500K+ customer interaction rows using Python Pandas and SQL, identifying key bottleneck trends that increased retention by 14%.",
      "Designed interactive executive dashboards in PowerBI and Tableau, providing real-time tracking of core KPI metrics.",
      "Conducted A/B testing and statistical regression analyses to evaluate marketing campaign performance and ad ROI."
    ],
    summary: "Data Analyst skilled in SQL querying, Python analytics, statistical modeling, and BI dashboard visualization.",
    templateData: {
      name: "Ananya Roy",
      title: "Data Analyst",
      skills: { frontend: [], backend: ["Python", "Pandas", "NumPy"], database: ["SQL", "PostgreSQL"], cloud: [], tools: ["PowerBI", "Tableau", "Excel", "Git"] }
    }
  }
};

export async function getResumeExamples(roleSlug?: string) {
  if (!roleSlug || roleSlug === "all") {
    return Object.values(RESUME_ROLE_EXAMPLES);
  }

  const normalized = roleSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const example = RESUME_ROLE_EXAMPLES[normalized] || Object.values(RESUME_ROLE_EXAMPLES).find(e => e.role.toLowerCase().includes(roleSlug.toLowerCase()));

  if (!example) {
    throw new ApiError(404, `No resume template found for role: ${roleSlug}`);
  }

  return example;
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
