// ATS Scoring Engine v2 — deterministic heuristic, no fake AI claims.
// 5-category breakdown: Content, Format, Optimization, BestPractices, Readiness.
// "Why this score" explanation included in every result.
// DISCLAIMER: Score is a heuristic estimate to help find gaps, not a guarantee of ATS acceptance.
import { callJsonModel, getAiRuntime } from "../ai/aiClient.js";

const roleKeywordBanks = {
  react: ["React", "TypeScript", "JavaScript", "Hooks", "Redux", "Tailwind", "Responsive UI", "REST API", "Testing", "Git"],
  frontend: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Responsive UI", "Accessibility", "Tailwind", "API integration", "Testing"],
  mern: ["MongoDB", "Express", "React", "Node.js", "REST API", "JWT", "Authentication", "Mongoose", "TypeScript", "Deployment"],
  node: ["Node.js", "Express", "REST API", "MongoDB", "Mongoose", "JWT", "Authentication", "Validation", "Testing", "Deployment"],
  fullstack: ["React", "Node.js", "Express", "MongoDB", "TypeScript", "REST API", "Authentication", "Testing", "Deployment", "Git"],
  python: ["Python", "Django", "Flask", "REST API", "PostgreSQL", "Docker", "Git", "Testing", "Authentication", "Deployment"],
  devops: ["Docker", "Kubernetes", "CI/CD", "AWS", "Terraform", "Linux", "Bash", "Git", "Monitoring", "Deployment"],
  data: ["Python", "SQL", "Pandas", "NumPy", "Machine Learning", "Data Analysis", "Visualization", "Statistics", "Jupyter", "Git"]
} as const;

export const technicalKeywordBank = Array.from(new Set<string>([
  ...Object.values(roleKeywordBanks).flat(),
  "Java", "DSA", "SQL", "Next.js", "Docker", "AWS", "CI/CD", "Redis", "BullMQ", "Zod", "Recharts",
  "GraphQL", "gRPC", "Kafka", "Elasticsearch", "PostgreSQL", "MySQL", "Prisma", "Drizzle"
]));

const actionVerbs = [
  "built", "created", "developed", "implemented", "designed", "integrated", "optimized",
  "deployed", "tested", "improved", "debugged", "launched", "architected", "led", "migrated",
  "automated", "reduced", "increased", "delivered", "shipped", "refactored", "scaled", "configured"
];

// Quantification patterns: numbers used with measurable units in bullet points.
const quantificationPatterns = [
  /\d+\s*%/i,                          // 30%
  /\d+[kmb]\+?\s*(users|requests|api|jobs|downloads|records|rows|nodes)/i, // 10k users
  /reduced.*by.*\d+/i,                 // reduced by 40
  /increased.*by.*\d+/i,               // increased by 25%
  /improved.*\d+/i,                    // improved 3x
  /\d+x\s*(faster|improvement|speed)/i // 3x faster
];

type RoleBankName = keyof typeof roleKeywordBanks;

function normalize(text: unknown) {
  return String(text || "").toLowerCase();
}

function includesTerm(text: string, term: string) {
  const lowerTerm = term.toLowerCase();
  if (/^[a-z0-9.+#-]+$/i.test(term)) return text.includes(lowerTerm);
  return lowerTerm.split(/\s+/).every((part) => text.includes(part));
}

function selectRoleBank(targetRole: string): RoleBankName {
  const role = normalize(targetRole);
  if (role.includes("mern")) return "mern";
  if (role.includes("node") || role.includes("backend")) return "node";
  if (role.includes("react")) return "react";
  if (role.includes("front")) return "frontend";
  if (role.includes("python") || role.includes("django") || role.includes("flask")) return "python";
  if (role.includes("devops") || role.includes("cloud") || role.includes("infra")) return "devops";
  if (role.includes("data") || role.includes("analyst") || role.includes("scientist")) return "data";
  return "fullstack";
}

function scorePercent(value: number, max: number) {
  return Math.round(Math.min(max, Math.max(0, value)) / max * 100);
}

function resumeLevel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Needs Work";
  return "Weak";
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

// ---------- Content Score (max 25) ----------
// Measures: word count, active voice (action verbs), quantified bullets.
function scoreContent(resume: any): { score: number; max: number; why: string; issues: string[] } {
  const rawText = String(resume?.rawText || "");
  const parsed = resume?.parsedData || {};
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const bullets = [...(parsed.projects || []), ...(parsed.experience || [])].map((b) => String(b || "").toLowerCase());

  const detectedActionVerbs = actionVerbs.filter((verb) => rawText.toLowerCase().includes(verb));
  const quantifiedBullets = bullets.filter((b) => quantificationPatterns.some((p) => p.test(b)));
  const hasProfileSummary = String(parsed.summary || "").length >= 80;

  // Points: word count (0-8), action verbs (0-7), quantified bullets (0-6), summary (0-4)
  const wordScore = Math.min(8, Math.round(Math.min(wordCount, 600) / 75));
  const verbScore = Math.min(7, detectedActionVerbs.length);
  const quantScore = Math.min(6, quantifiedBullets.length * 2);
  const summaryScore = hasProfileSummary ? 4 : 0;
  const score = wordScore + verbScore + quantScore + summaryScore;

  const issues: string[] = [];
  if (wordCount < 200) issues.push("Resume appears very short (under 200 words). Add project and experience detail.");
  if (detectedActionVerbs.length < 3) issues.push("Add more action verbs (built, implemented, deployed, optimized, etc.).");
  if (quantifiedBullets.length === 0) issues.push("No measurable impact found (e.g., 'reduced load time by 40%'). Add numbers where truthful.");
  if (!hasProfileSummary) issues.push("Summary section is missing or too short (under 80 characters).");

  const why = `Content score ${score}/25: ${wordCount} words detected, ${detectedActionVerbs.length} action verbs, ${quantifiedBullets.length} quantified bullet(s), summary ${hasProfileSummary ? "present" : "missing"}.`;
  return { score, max: 25, why, issues };
}

// ---------- Format Score (max 20) ----------
// Measures: section presence, estimated page fit, ATS-risky formatting detection.
function scoreFormat(resume: any): { score: number; max: number; why: string; issues: string[] } {
  const rawText = String(resume?.rawText || "");
  const parsed = resume?.parsedData || {};
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  const detectedSections = Array.isArray(parsed.detectedSections)
    ? parsed.detectedSections.map((s: string) => normalize(s))
    : [];
  const searchable = normalize(rawText);

  const hasContactSection = Boolean(parsed.email || parsed.phone);
  const hasSkillsSection = (detectedSections as string[]).some((s: string) => s.includes("skill")) || (parsed.skills?.length > 0);
  const hasExperienceSection = (detectedSections as string[]).some((s: string) => s.includes("experience") || s.includes("work")) || (parsed.experience?.length > 0);
  const hasProjectSection = (detectedSections as string[]).some((s: string) => s.includes("project")) || (parsed.projects?.length > 0);
  const hasEducationSection = (detectedSections as string[]).some((s: string) => s.includes("education")) || (parsed.education?.length > 0);

  // Page fit: <600 words = good ATS scan zone. >900 = likely 2 pages.
  const pageFit = wordCount <= 650;
  // Check for table/column formatting risk keywords
  const hasRiskyFormatting = searchable.includes("|") && searchable.includes("\t");

  // Points: each required section (0-15) + page fit (0-3) + no risky formatting (0-2)
  const sectionScore = [hasContactSection, hasSkillsSection, hasExperienceSection, hasProjectSection, hasEducationSection]
    .filter(Boolean).length * 3;
  const pageFitScore = pageFit ? 3 : 1;
  const formatRiskScore = hasRiskyFormatting ? 0 : 2;
  const score = sectionScore + pageFitScore + formatRiskScore;

  const issues: string[] = [];
  if (!hasSkillsSection) issues.push("Skills section appears missing or not detected by parser.");
  if (!hasExperienceSection && !hasProjectSection) issues.push("No experience or projects section detected. Add structured sections.");
  if (!hasEducationSection) issues.push("Education section missing or not detected.");
  if (!pageFit) issues.push("Resume may exceed one page (over 650 words). ATS works best with single-page resumes.");
  if (hasRiskyFormatting) issues.push("Tables or tab characters detected — some ATS parsers misread table-based layouts.");

  const sectionList = [hasContactSection && "Contact", hasSkillsSection && "Skills", hasExperienceSection && "Experience", hasProjectSection && "Projects", hasEducationSection && "Education"].filter(Boolean).join(", ");
  const why = `Format score ${score}/20: Sections found — ${sectionList || "none detected"}. Page fit: ${pageFit ? "good" : "may exceed one page"}. ATS-risky formatting: ${hasRiskyFormatting ? "detected" : "none"}.`;
  return { score, max: 20, why, issues };
}

// ---------- Optimization Score (max 25) ----------
// Measures: role keyword coverage vs keyword bank for selected role.
function scoreOptimization(resume: any, targetRole: string): { score: number; max: number; why: string; issues: string[]; detectedKeywords: string[]; missingKeywords: string[] } {
  const parsed = resume?.parsedData || {};
  const rawText = String(resume?.rawText || "");
  const searchable = normalize([rawText, parsed.summary, parsed.skills?.join(" "), parsed.projects?.join(" "), parsed.experience?.join(" ")].join(" "));
  const bankName = selectRoleBank(targetRole);
  const keywordBank = roleKeywordBanks[bankName];
  const detectedKeywords = keywordBank.filter((keyword) => includesTerm(searchable, keyword));
  const missingKeywords = keywordBank.filter((keyword) => !detectedKeywords.includes(keyword));

  const coverageRatio = keywordBank.length > 0 ? detectedKeywords.length / keywordBank.length : 0;
  const score = Math.min(25, Math.round(coverageRatio * 25));

  const issues: string[] = [];
  if (missingKeywords.length > 0) issues.push(`Missing ${bankName.toUpperCase()} keywords: ${missingKeywords.slice(0, 6).join(", ")}. Add these where they truthfully reflect your skills.`);
  if (coverageRatio < 0.5) issues.push(`Keyword coverage is below 50% for ${targetRole}. Review the role keyword bank and include relevant skills.`);

  const why = `Optimization score ${score}/25: ${detectedKeywords.length}/${keywordBank.length} ${bankName.toUpperCase()} role keywords matched (${Math.round(coverageRatio * 100)}%).`;
  return { score, max: 25, why, issues, detectedKeywords: Array.from(detectedKeywords), missingKeywords: Array.from(missingKeywords) };
}

// ---------- Best Practices Score (max 20) ----------
// Measures: contact completeness, links, email format, no risky email domains.
function scoreBestPractices(resume: any): { score: number; max: number; why: string; issues: string[] } {
  const parsed = resume?.parsedData || {};
  const rawText = String(resume?.rawText || "");
  const emailRaw = String(parsed.email || "");
  const phoneRaw = String(parsed.phone || rawText.match(/(?:\+?\d[\s-]?){10,14}/)?.[0] || "");
  const links = Array.isArray(parsed.links) ? parsed.links : [];

  const hasEmail = Boolean(emailRaw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i));
  const hasPhone = phoneRaw.replace(/\D/g, "").length >= 10;
  const hasLinkedIn = links.some((l: string) => /linkedin\.com/i.test(l));
  const hasGitHub = links.some((l: string) => /github\.com/i.test(l));
  const hasPersonalEmail = /gmail\.com|yahoo\.com|outlook\.com|hotmail\.com/i.test(emailRaw);
  const hasProfessionalEmail = hasEmail && !hasPersonalEmail;

  // Points: email (0-5), phone (0-5), LinkedIn (0-4), GitHub (0-4), professional email bonus (0-2)
  const emailScore = hasEmail ? 5 : 0;
  const phoneScore = hasPhone ? 5 : 0;
  const linkedInScore = hasLinkedIn ? 4 : 0;
  const gitHubScore = hasGitHub ? 4 : 0;
  const profEmailScore = hasProfessionalEmail ? 2 : 0;
  const score = Math.min(20, emailScore + phoneScore + linkedInScore + gitHubScore + profEmailScore);

  const issues: string[] = [];
  if (!hasEmail) issues.push("Email address not detected. Ensure it is in plain text, not an image.");
  if (!hasPhone) issues.push("Phone number not detected or has fewer than 10 digits.");
  if (!hasLinkedIn) issues.push("No LinkedIn URL found. Add your LinkedIn profile link.");
  if (!hasGitHub) issues.push("No GitHub URL found. For tech roles, GitHub is expected.");
  if (hasPersonalEmail) issues.push("Consider using a professional email (custom domain) on a formal resume.");

  const why = `Best practices score ${score}/20: Email ${hasEmail ? "found" : "missing"}, Phone ${hasPhone ? "found" : "missing"}, LinkedIn ${hasLinkedIn ? "found" : "missing"}, GitHub ${hasGitHub ? "found" : "missing"}.`;
  return { score, max: 20, why, issues };
}

// ---------- Application Readiness Score (max 10) ----------
// Measures: section completeness, actionable role alignment.
function scoreApplicationReadiness(resume: any, targetRole: string): { score: number; max: number; why: string; issues: string[] } {
  const parsed = resume?.parsedData || {};
  const rawText = String(resume?.rawText || "");
  const searchable = normalize(rawText);
  const hasName = Boolean(parsed.name && String(parsed.name).length > 1);
  const hasCertifications = (parsed.certifications || []).length > 0;
  const hasLinks = (parsed.links || []).length > 0;
  const hasRoleKeyword = normalize(targetRole).split(/\s+/).some((token) => token.length > 3 && searchable.includes(token));

  // Points: name (2), links (2), certifications (2), role keyword in resume (2), recent projects/experience (2)
  const nameScore = hasName ? 2 : 0;
  const linksScore = hasLinks ? 2 : 0;
  const certScore = hasCertifications ? 2 : 0;
  const roleAlignScore = hasRoleKeyword ? 2 : 0;
  const hasRecentWork = (parsed.experience || []).length > 0 || (parsed.projects || []).length > 0;
  const recentWorkScore = hasRecentWork ? 2 : 0;
  const score = nameScore + linksScore + certScore + roleAlignScore + recentWorkScore;

  const issues: string[] = [];
  if (!hasName) issues.push("Your name is not detected in the resume. Ensure it is in the resume header in plain text.");
  if (!hasLinks) issues.push("No links detected. Add LinkedIn, GitHub, or portfolio links.");
  if (!hasRoleKeyword) issues.push(`The target role "${targetRole}" is not referenced in the resume. Mirror role terminology.`);
  if (!hasRecentWork) issues.push("No experience or projects detected. At least one project is recommended.");

  const why = `Application readiness ${score}/10: Name ${hasName ? "found" : "missing"}, links ${hasLinks ? "found" : "missing"}, role keyword ${hasRoleKeyword ? "found" : "missing"}, work/projects ${hasRecentWork ? "present" : "missing"}.`;
  return { score, max: 10, why, issues };
}

// ==================== PUBLIC API ====================

const commonJobWords = new Set([
  "and", "the", "with", "for", "you", "our", "will", "are", "this", "that", "from", "have", "has", "must", "good", "role", "team", "work", "job", "skills", "experience", "required", "preferred"
]);

function extractJobKeywords(jobDescription: string) {
  const text = normalize(jobDescription);
  const bankKeywords = technicalKeywordBank.filter((keyword) => includesTerm(text, keyword));
  const phraseKeywords = Array.from(jobDescription.matchAll(/\b[A-Z][A-Za-z0-9.+#-]*(?:\s+[A-Z][A-Za-z0-9.+#-]*){0,2}\b/g)).map((match) => match[0]);
  const tokenKeywords = text
    .split(/[^a-z0-9.+#-]+/i)
    .filter((token) => token.length >= 4 && !commonJobWords.has(token))
    .slice(0, 120);
  return unique([...bankKeywords, ...phraseKeywords, ...tokenKeywords]).slice(0, 28);
}

function getLocalScoreAgainstJobDescription(resume: any, jobDescription = "") {
  if (!jobDescription.trim()) return null;
  const parsed = resume?.parsedData || {};
  const searchable = normalize([resume?.rawText, parsed.summary, parsed.skills?.join(" "), parsed.projects?.join(" "), parsed.experience?.join(" ")].join(" "));
  const keywords = extractJobKeywords(jobDescription);
  const detectedKeywords = keywords.filter((keyword) => includesTerm(searchable, keyword));
  const missingKeywords = keywords.filter((keyword) => !detectedKeywords.includes(keyword));
  const coveragePercent = keywords.length ? Math.round((detectedKeywords.length / keywords.length) * 100) : 0;
  return {
    detectedKeywords,
    missingKeywords,
    coveragePercent,
    keywordCount: keywords.length,
    suggestions: unique([
      missingKeywords.length ? `Work in truthful job-description keywords where they match your real background: ${missingKeywords.slice(0, 6).join(", ")}.` : "",
      "Mirror the job description's wording for tools and responsibilities without inventing skills.",
      "Move the most relevant project and experience bullets closer to the top before applying."
    ])
  };
}

function getLocalScoreForRole(resume: any, targetRole: string) {
  const content = scoreContent(resume);
  const format = scoreFormat(resume);
  const optimization = scoreOptimization(resume, targetRole);
  const bestPractices = scoreBestPractices(resume);
  const readiness = scoreApplicationReadiness(resume, targetRole);

  const parsed = resume?.parsedData || {};
  const rawText = String(resume?.rawText || "");
  const searchable = normalize([rawText, parsed.summary, parsed.skills?.join(" "), parsed.projects?.join(" "), parsed.experience?.join(" ")].join(" "));

  const bankName = selectRoleBank(targetRole);
  const keywordBank = roleKeywordBanks[bankName];
  const detectedKeywords = optimization.detectedKeywords;
  const missingKeywords = optimization.missingKeywords;
  const skillMatches = unique([...(parsed.skills || []), ...detectedKeywords]);
  const projectLines = Array.isArray(parsed.projects) ? parsed.projects : [];
  const experienceLines = Array.isArray(parsed.experience) ? parsed.experience : [];
  const detectedActionVerbs = actionVerbs.filter((verb) => includesTerm(searchable, verb));
  const sectionHints = ["summary", "skills", "project", "experience", "education"].filter((hint) => searchable.includes(hint));
  const hasEmail = Boolean(parsed.email || rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i));
  const hasPhone = Boolean(parsed.phone || rawText.match(/(?:\+?\d[\s-]?){10,14}/));
  const hasLink = Array.isArray(parsed.links) && parsed.links.length > 0;

  const contactInformation = Math.min(10, (hasEmail ? 4 : 0) + (hasPhone ? 4 : 0) + (hasLink ? 2 : 0));
  const skillsMatch = Math.min(25, Math.round((detectedKeywords.length / keywordBank.length) * 20) + Math.min(5, skillMatches.length));
  const projectQuality = Math.min(25, projectLines.length * 4 + experienceLines.length * 2 + Math.min(5, detectedActionVerbs.length));
  const keywords = Math.round((detectedKeywords.length / keywordBank.length) * 20);
  const formattingScore = Math.min(10, sectionHints.length * 2 + (rawText.length > 250 ? 2 : 0));
  const actionVerbScore = Math.min(10, detectedActionVerbs.length * 2);
  const legacyAtsScore = Math.min(100, contactInformation + skillsMatch + projectQuality + keywords + formattingScore + actionVerbScore);

  const atsScore = Math.min(100, content.score + format.score + optimization.score + bestPractices.score + readiness.score);
  const allIssues = unique([...content.issues, ...format.issues, ...optimization.issues, ...bestPractices.issues, ...readiness.issues]);

  const strengths = unique([
    detectedKeywords.length >= 4 ? `Strong ${bankName.toUpperCase()} keyword alignment.` : "",
    projectLines.length > 0 ? "Project section is visible to the parser." : "",
    hasEmail && hasPhone ? "Contact information is present." : "",
    detectedActionVerbs.length > 0 ? "Resume uses action-oriented language." : "",
    content.score >= 20 ? "Content quality is strong." : "",
    format.score >= 16 ? "Document format is ATS-friendly." : ""
  ].filter(Boolean));

  const weaknesses = unique([...allIssues.slice(0, 6)]);

  return {
    atsScore,
    resumeLevel: resumeLevel(atsScore),
    categoryScores: {
      content: { score: content.score, max: content.max, why: content.why },
      format: { score: format.score, max: format.max, why: format.why },
      optimization: { score: optimization.score, max: optimization.max, why: optimization.why },
      bestPractices: { score: bestPractices.score, max: bestPractices.max, why: bestPractices.why },
      applicationReadiness: { score: readiness.score, max: readiness.max, why: readiness.why }
    },
    scoreExplanation: [content.why, format.why, optimization.why, bestPractices.why, readiness.why].join(" | "),
    sectionScores: {
      summary: scorePercent(String(parsed.summary || "").length, 240),
      skills: scorePercent(skillsMatch, 25),
      projects: scorePercent(projectQuality, 25),
      experience: scorePercent(experienceLines.length * 5, 25),
      education: scorePercent(Array.isArray(parsed.education) ? parsed.education.length * 10 : 0, 20),
      formatting: scorePercent(formattingScore, 10)
    },
    strengths,
    weaknesses,
    missingKeywords,
    improvementSuggestions: unique([
      ...allIssues,
      "Keep the resume ATS-friendly with clear sections, simple formatting, and truthful role keywords."
    ]),
    recruiterView: `${resumeLevel(atsScore)} ${targetRole} fit with ${detectedKeywords.length}/${keywordBank.length} role keywords detected.`,
    roleKeywordBank: { name: bankName, keywords: Array.from(keywordBank) },
    keywordCoverage: {
      targetRole,
      detectedKeywords,
      missingKeywords,
      coveragePercent: Math.round((detectedKeywords.length / keywordBank.length) * 100)
    },
    atsBreakdown: {
      contactInformation,
      skillsMatch,
      experienceProjectQuality: projectQuality,
      keywords,
      formatting: formattingScore,
      actionVerbs: actionVerbScore,
      total: legacyAtsScore
    }
  };
}

export async function scoreResumeAgainstJobDescription(resume: any, jobDescription = "") {
  const local = getLocalScoreAgainstJobDescription(resume, jobDescription);
  if (!local) return null;

  const runtime = getAiRuntime();
  if (runtime.provider === "mock") {
    return local;
  }

  const prompt = `Analyze the following resume text against the job description. Identify matching keywords/skills, missing keywords/skills, coverage percent, and actionable suggestions to align the resume with the job description.

Job Description:
${jobDescription}

Resume Text:
${resume.rawText || ""}

Return a JSON object matching this schema exactly:
{
  "detectedKeywords": ["string"],
  "missingKeywords": ["string"],
  "coveragePercent": number,
  "keywordCount": number,
  "suggestions": ["string"]
}`;

  try {
    const aiResult = await callJsonModel(prompt, local);
    return {
      detectedKeywords: Array.isArray(aiResult.detectedKeywords) ? aiResult.detectedKeywords : local.detectedKeywords,
      missingKeywords: Array.isArray(aiResult.missingKeywords) ? aiResult.missingKeywords : local.missingKeywords,
      coveragePercent: typeof aiResult.coveragePercent === "number" ? aiResult.coveragePercent : local.coveragePercent,
      keywordCount: typeof aiResult.keywordCount === "number" ? aiResult.keywordCount : local.keywordCount,
      suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : local.suggestions
    };
  } catch (error) {
    console.error("AI scoreResumeAgainstJobDescription failed, returning local fallback:", error);
    return local;
  }
}

export async function scoreResumeForRole(resume: any, targetRole = "Full Stack Developer") {
  const local = getLocalScoreForRole(resume, targetRole);
  const runtime = getAiRuntime();
  if (runtime.provider === "mock") {
    return local;
  }

  const prompt = `Analyze the following resume text for the target role "${targetRole}".
Evaluate the resume across 5 categories:
1. Content (max 25): word count, active voice, quantified impact.
2. Format (max 20): section presence, layout scan-friendliness.
3. Optimization (max 25): keyword matching and skill coverage.
4. Best Practices (max 20): professional contact info, email format.
5. Application Readiness (max 10): name presence, certifications, target role terminology.

Return a JSON object conforming exactly to this schema:
{
  "atsScore": number,
  "resumeLevel": "Excellent" | "Good" | "Needs Work" | "Weak",
  "categoryScores": {
    "content": { "score": number, "max": 25, "why": "string" },
    "format": { "score": number, "max": 20, "why": "string" },
    "optimization": { "score": number, "max": 25, "why": "string" },
    "bestPractices": { "score": number, "max": 20, "why": "string" },
    "applicationReadiness": { "score": number, "max": 10, "why": "string" }
  },
  "scoreExplanation": "string",
  "sectionScores": {
    "summary": number,
    "skills": number,
    "projects": number,
    "experience": number,
    "education": number,
    "formatting": number
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingKeywords": ["string"],
  "improvementSuggestions": ["string"],
  "recruiterView": "string"
}

Resume Text:
${resume.rawText || ""}
Parsed Data:
${JSON.stringify(resume.parsedData || {})}`;

  try {
    const aiResult = await callJsonModel(prompt, local);

    const atsScore = typeof aiResult.atsScore === "number" ? aiResult.atsScore : local.atsScore;
    const resumeLevel = aiResult.resumeLevel || local.resumeLevel;
    const categoryScores = aiResult.categoryScores || local.categoryScores;
    const scoreExplanation = aiResult.scoreExplanation || local.scoreExplanation;
    const sectionScores = aiResult.sectionScores || local.sectionScores;
    const strengths = Array.isArray(aiResult.strengths) ? aiResult.strengths : local.strengths;
    const weaknesses = Array.isArray(aiResult.weaknesses) ? aiResult.weaknesses : local.weaknesses;
    const missingKeywords = Array.isArray(aiResult.missingKeywords) ? aiResult.missingKeywords : local.missingKeywords;
    const improvementSuggestions = Array.isArray(aiResult.improvementSuggestions) ? aiResult.improvementSuggestions : local.improvementSuggestions;
    const recruiterView = aiResult.recruiterView || local.recruiterView;

    // Fill helper/compat properties
    const contactInformation = categoryScores.bestPractices?.score ? Math.round(categoryScores.bestPractices.score / 2) : 8;
    const skillsMatch = categoryScores.optimization?.score || 20;
    const projectQuality = categoryScores.content?.score || 20;
    const keywordsVal = categoryScores.optimization?.score ? Math.round(categoryScores.optimization.score * 0.8) : 16;
    const formattingScore = categoryScores.format?.score ? Math.round(categoryScores.format.score / 2) : 8;
    const actionVerbScore = categoryScores.content?.score ? Math.round(categoryScores.content.score * 0.4) : 8;
    const legacyAtsScore = Math.min(100, contactInformation + skillsMatch + projectQuality + keywordsVal + formattingScore + actionVerbScore);

    return {
      atsScore,
      resumeLevel,
      categoryScores,
      scoreExplanation,
      sectionScores,
      strengths,
      weaknesses,
      missingKeywords,
      improvementSuggestions,
      recruiterView,
      roleKeywordBank: local.roleKeywordBank,
      keywordCoverage: {
        targetRole,
        detectedKeywords: local.keywordCoverage.detectedKeywords,
        missingKeywords,
        coveragePercent: local.keywordCoverage.coveragePercent
      },
      atsBreakdown: {
        contactInformation,
        skillsMatch,
        experienceProjectQuality: projectQuality,
        keywords: keywordsVal,
        formatting: formattingScore,
        actionVerbs: actionVerbScore,
        total: legacyAtsScore
      }
    };
  } catch (error) {
    console.error("AI scoreResumeForRole failed, returning local fallback:", error);
    return local;
  }
}
