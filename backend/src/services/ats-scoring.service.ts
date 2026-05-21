const roleKeywordBanks = {
  react: ["React", "TypeScript", "JavaScript", "Hooks", "Redux", "Tailwind", "Responsive UI", "REST API", "Testing", "Git"],
  frontend: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Responsive UI", "Accessibility", "Tailwind", "API integration", "Testing"],
  mern: ["MongoDB", "Express", "React", "Node.js", "REST API", "JWT", "Authentication", "Mongoose", "TypeScript", "Deployment"],
  node: ["Node.js", "Express", "REST API", "MongoDB", "Mongoose", "JWT", "Authentication", "Validation", "Testing", "Deployment"],
  fullstack: ["React", "Node.js", "Express", "MongoDB", "TypeScript", "REST API", "Authentication", "Testing", "Deployment", "Git"]
} as const;

export const technicalKeywordBank = Array.from(new Set<string>([
  ...Object.values(roleKeywordBanks).flat(),
  "Java", "DSA", "SQL", "Next.js", "Docker", "AWS", "CI/CD", "Redis", "BullMQ", "Zod", "Recharts"
]));

const actionVerbs = ["built", "created", "developed", "implemented", "designed", "integrated", "optimized", "deployed", "tested", "improved", "debugged", "launched"];

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

export function scoreResumeAgainstJobDescription(resume: any, jobDescription = "") {
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

export function scoreResumeForRole(resume: any, targetRole = "Full Stack Developer") {
  const parsed = resume?.parsedData || {};
  const rawText = String(resume?.rawText || "");
  const searchable = normalize([rawText, parsed.summary, parsed.skills?.join(" "), parsed.projects?.join(" "), parsed.experience?.join(" ")].join(" "));
  const bankName = selectRoleBank(targetRole);
  const keywordBank = roleKeywordBanks[bankName];
  const detectedKeywords = keywordBank.filter((keyword) => includesTerm(searchable, keyword));
  const missingKeywords = keywordBank.filter((keyword) => !detectedKeywords.includes(keyword));
  const skillMatches = unique([...(parsed.skills || []), ...detectedKeywords]);
  const projectLines = Array.isArray(parsed.projects) ? parsed.projects : [];
  const experienceLines = Array.isArray(parsed.experience) ? parsed.experience : [];
  const hasEmail = Boolean(parsed.email || rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i));
  const hasPhone = Boolean(parsed.phone || rawText.match(/(?:\+?\d[\s-]?){10,14}/));
  const hasLink = Array.isArray(parsed.links) && parsed.links.length > 0;
  const detectedActionVerbs = actionVerbs.filter((verb) => includesTerm(searchable, verb));
  const sectionHints = ["summary", "skills", "project", "experience", "education"].filter((hint) => searchable.includes(hint));

  const contactInformation = Math.min(10, (hasEmail ? 4 : 0) + (hasPhone ? 4 : 0) + (hasLink ? 2 : 0));
  const skillsMatch = Math.min(25, Math.round((detectedKeywords.length / keywordBank.length) * 20) + Math.min(5, skillMatches.length));
  const projectQuality = Math.min(25, projectLines.length * 4 + experienceLines.length * 2 + Math.min(5, detectedActionVerbs.length));
  const keywords = Math.round((detectedKeywords.length / keywordBank.length) * 20);
  const formatting = Math.min(10, sectionHints.length * 2 + (rawText.length > 250 ? 2 : 0));
  const actionVerbScore = Math.min(10, detectedActionVerbs.length * 2);
  const atsScore = Math.min(100, contactInformation + skillsMatch + projectQuality + keywords + formatting + actionVerbScore);

  const strengths = [
    detectedKeywords.length >= 4 ? `Strong ${bankName.toUpperCase()} keyword alignment.` : "",
    projectLines.length > 0 ? "Project section is visible to the parser." : "",
    hasEmail && hasPhone ? "Contact information is present." : "",
    detectedActionVerbs.length > 0 ? "Resume uses action-oriented language." : ""
  ].filter(Boolean);

  const weaknesses = [
    !hasPhone || !hasEmail ? "Contact information is incomplete." : "",
    projectLines.length < 2 ? "Project bullets need more detail and proof of ownership." : "",
    missingKeywords.length > 0 ? "Some target-role keywords are missing." : "",
    detectedActionVerbs.length < 3 ? "Add more action verbs to project and experience bullets." : ""
  ].filter(Boolean);

  return {
    atsScore,
    resumeLevel: resumeLevel(atsScore),
    sectionScores: {
      summary: scorePercent(String(parsed.summary || "").length, 240),
      skills: scorePercent(skillsMatch, 25),
      projects: scorePercent(projectQuality, 25),
      experience: scorePercent(experienceLines.length * 5, 25),
      education: scorePercent(Array.isArray(parsed.education) ? parsed.education.length * 10 : 0, 20),
      formatting: scorePercent(formatting, 10)
    },
    strengths: unique(strengths),
    weaknesses: unique(weaknesses),
    missingKeywords,
    improvementSuggestions: unique([
      missingKeywords.length ? `Add truthful ${targetRole} keywords where they match your actual skills: ${missingKeywords.slice(0, 5).join(", ")}.` : "",
      projectLines.length < 2 ? "Add 2-3 project bullets that explain stack, responsibility, and result." : "",
      detectedActionVerbs.length < 3 ? "Start bullets with action verbs such as built, implemented, integrated, tested, or deployed." : "",
      "Keep the resume ATS-friendly with clear sections, simple formatting, and truthful role keywords."
    ]),
    recruiterView: `${resumeLevel(atsScore)} ${targetRole} fit with ${detectedKeywords.length}/${keywordBank.length} role keywords detected.`,
    roleKeywordBank: { name: bankName, keywords: keywordBank },
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
      formatting,
      actionVerbs: actionVerbScore,
      total: atsScore
    }
  };
}
