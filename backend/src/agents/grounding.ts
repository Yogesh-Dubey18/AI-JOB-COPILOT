/**
 * Grounding helpers shared by every agent fallback. Everything here derives
 * output strictly from data the user (or a job posting) actually supplied -
 * nothing is invented. Keep this module free of I/O so it stays unit-testable.
 */

// Broad, role-agnostic vocabulary so non-developer resumes (data, design,
// marketing, finance, operations) are recognised, not just MERN stacks.
export const SKILL_VOCABULARY: string[] = [
  // Programming & web
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "Scala", "R",
  "HTML", "CSS", "React", "Next.js", "Angular", "Vue", "Svelte", "Redux", "Tailwind", "Bootstrap",
  "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", "Laravel", ".NET", "GraphQL", "REST API",
  // Data & databases
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Oracle", "SQLite", "Firebase", "DynamoDB",
  "Excel", "Power BI", "Tableau", "Looker", "Pandas", "NumPy", "Spark", "Hadoop", "Airflow", "dbt", "Snowflake", "BigQuery",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "scikit-learn", "NLP", "Statistics", "Data Analysis", "Data Visualization", "ETL",
  // Cloud & DevOps
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins", "GitHub Actions", "Linux", "Nginx", "Vercel",
  // Engineering practices
  "Git", "Jest", "Cypress", "Playwright", "Unit Testing", "Microservices", "System Design", "DSA", "OOP", "JWT", "OAuth",
  // Design / product / business
  "Figma", "Adobe XD", "Photoshop", "Illustrator", "UI/UX", "Wireframing", "Prototyping", "User Research",
  "Product Management", "Agile", "Scrum", "Jira", "Confluence", "Stakeholder Management", "Project Management",
  "SEO", "SEM", "Google Analytics", "Content Marketing", "Social Media Marketing", "Email Marketing", "Copywriting", "HubSpot", "Salesforce", "CRM",
  "Financial Modeling", "Accounting", "Tally", "GST", "Budgeting", "Forecasting", "Auditing", "SAP",
  "Customer Service", "Sales", "Negotiation", "Recruitment", "Operations", "Supply Chain", "Inventory Management"
];

const ALIASES: Record<string, string[]> = {
  "Node.js": ["nodejs", "node js", "node"],
  "React": ["react.js", "reactjs"],
  "Next.js": ["nextjs", "next js"],
  "Express": ["express.js", "expressjs"],
  "MongoDB": ["mongo db", "mongo"],
  "PostgreSQL": ["postgres"],
  "REST API": ["rest apis", "restful", "rest"],
  "Power BI": ["powerbi"],
  "Machine Learning": ["ml"],
  "CI/CD": ["ci cd", "cicd"],
  "Kubernetes": ["k8s"],
  "UI/UX": ["ui ux", "ux", "ui design"],
  "GCP": ["google cloud"],
  "Excel": ["ms excel", "microsoft excel", "advanced excel"],
  "Data Visualization": ["dashboards", "dashboarding"]
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termPattern(term: string) {
  // Custom boundaries so "C++", ".NET", "Node.js" and "R" behave sensibly.
  return new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(term.toLowerCase())}(?=$|[^a-z0-9+#])`, "i");
}

const SHORT_AMBIGUOUS = new Set(["R", "Go", "C#", "C++"]);

export function textMentions(text: string, skill: string): boolean {
  const haystack = ` ${text.toLowerCase()} `;
  const candidates = [skill, ...(ALIASES[skill] || [])];
  return candidates.some((candidate) => {
    if (SHORT_AMBIGUOUS.has(candidate)) {
      // Require list-like context for very short names to avoid matching the letter "r" or the verb "go".
      return new RegExp(`(^|[,|/(\\s])${escapeRegex(candidate.toLowerCase())}(?=\\s*($|[,|/)]))`, "im").test(text.toLowerCase());
    }
    return termPattern(candidate).test(haystack);
  });
}

export function uniqueStrings(values: unknown[], limit = 50): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

/** Accepts a resume document, a parsedData object, or a world-class resume shape. */
export function getParsed(resume: any): any {
  if (!resume || typeof resume !== "object") return {};
  return resume.parsedData && typeof resume.parsedData === "object" ? resume.parsedData : resume;
}

export function collectResumeSkills(resume: any): string[] {
  const parsed = getParsed(resume);
  const values: unknown[] = [];
  const pushAll = (input: unknown) => {
    if (Array.isArray(input)) input.forEach((item) => (typeof item === "string" ? values.push(item) : item && typeof item === "object" && pushAll(Object.values(item))));
    else if (input && typeof input === "object") Object.values(input).forEach(pushAll);
    else if (typeof input === "string") values.push(input);
  };
  pushAll(parsed.skills);
  pushAll(parsed.categorizedSkills);
  const fromText = SKILL_VOCABULARY.filter((skill) => textMentions(resumePlainText(resume), skill));
  return uniqueStrings([...values, ...fromText], 80);
}

export function resumePlainText(resume: any): string {
  if (!resume) return "";
  if (typeof resume.rawText === "string" && resume.rawText.trim()) return resume.rawText;
  const parsed = getParsed(resume);
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") parts.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk({ summary: parsed.summary, skills: parsed.skills, categorizedSkills: parsed.categorizedSkills, experience: parsed.experience, projects: parsed.projects, education: parsed.education, certifications: parsed.certifications, achievements: parsed.achievements });
  return parts.join("\n");
}

export function extractKeywordsFromText(text: string, extra: unknown[] = [], limit = 20): string[] {
  const fromVocab = SKILL_VOCABULARY.filter((skill) => textMentions(text || "", skill));
  return uniqueStrings([...(extra || []), ...fromVocab], limit);
}

export function jobKeywords(job: any, jobDescription = ""): string[] {
  const text = [job?.title, job?.description, ...(job?.requirements || []), ...(job?.responsibilities || []), jobDescription].filter(Boolean).join("\n");
  return extractKeywordsFromText(text, Array.isArray(job?.skillsRequired) ? job.skillsRequired : [], 25);
}

export function keywordOverlap(resume: any, keywords: string[]) {
  const skills = collectResumeSkills(resume);
  const text = `${resumePlainText(resume)}\n${skills.join(", ")}`;
  const matched: string[] = [];
  const missing: string[] = [];
  for (const keyword of uniqueStrings(keywords, 40)) {
    const hit = skills.some((skill) => skill.toLowerCase() === keyword.toLowerCase()) || textMentions(text, keyword);
    (hit ? matched : missing).push(keyword);
  }
  const coverage = keywords.length ? Math.round((matched.length / uniqueStrings(keywords, 40).length) * 100) : 0;
  return { matched, missing, coverage };
}

export function clampScore(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Placeholder used wherever only the user can supply a truthful fact. */
export function confirmPlaceholder(what: string) {
  return `[Confirm before sending: ${what}]`;
}
