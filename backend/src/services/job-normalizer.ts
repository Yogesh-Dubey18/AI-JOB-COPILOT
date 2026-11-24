/**
 * Shared normalisation for jobs coming from external providers (Adzuna, Remotive, Arbeitnow, ...).
 * Providers used to copy-paste this logic with hard-coded defaults ("0-2 years", "Full-time", 8 skills);
 * everything now goes through here so matching sees consistent, honest data.
 */

const SKILL_GROUPS: Record<string, string[]> = {
  engineering: [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", ".NET", "Rust", "Kotlin", "PHP", "Ruby", "Scala", "Dart",
    "React", "Next.js", "Vue", "Angular", "Svelte", "Node.js", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", "Laravel", "Rails", "Flutter", "React Native",
    "HTML", "CSS", "Tailwind", "Redux", "GraphQL", "REST API", "gRPC", "Microservices", "WebSockets",
    "MongoDB", "PostgreSQL", "MySQL", "SQL", "NoSQL", "Redis", "Elasticsearch", "Kafka", "RabbitMQ", "Firebase", "DynamoDB",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "CI/CD", "Linux", "Git", "GitHub Actions", "DevOps",
    "Selenium", "Cypress", "Playwright", "Jest", "JUnit", "QA", "Manual Testing", "Test Automation", "Android", "iOS", "Cybersecurity", "Penetration Testing"
  ],
  data: [
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "Hadoop", "Airflow", "dbt",
    "Tableau", "Power BI", "Looker", "Data Analysis", "Data Engineering", "ETL", "Data Warehouse", "Snowflake", "BigQuery", "Statistics", "A/B Testing", "LLM", "Prompt Engineering"
  ],
  design: ["Figma", "Adobe XD", "Photoshop", "Illustrator", "UI Design", "UX Design", "User Research", "Wireframing", "Prototyping", "Motion Graphics", "Video Editing", "Branding"],
  marketing: [
    "SEO", "SEM", "Google Ads", "Facebook Ads", "Content Marketing", "Content Writing", "Copywriting", "Social Media", "Email Marketing", "Marketing Automation",
    "Google Analytics", "HubSpot", "Mailchimp", "Brand Management", "Performance Marketing", "Influencer Marketing", "Public Relations"
  ],
  sales: ["Sales", "Lead Generation", "Cold Calling", "Negotiation", "CRM", "Salesforce", "Account Management", "Business Development", "Customer Success", "Customer Support", "Inside Sales", "B2B", "B2C"],
  product: ["Product Management", "Product Roadmap", "Agile", "Scrum", "Jira", "Stakeholder Management", "Project Management", "PMP", "Business Analysis", "Requirements Gathering", "Kanban"],
  finance: ["Accounting", "Financial Analysis", "Financial Modeling", "Tally", "GST", "Taxation", "Auditing", "Bookkeeping", "Budgeting", "Forecasting", "SAP", "QuickBooks", "Investment Banking", "Risk Management", "Compliance"],
  people: ["Recruitment", "Talent Acquisition", "HR Operations", "Payroll", "Onboarding", "Employee Engagement", "Learning and Development", "Performance Management"],
  operations: ["Supply Chain", "Logistics", "Procurement", "Inventory Management", "Operations Management", "Six Sigma", "Quality Assurance", "Vendor Management", "Process Improvement"],
  soft: ["Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management", "Presentation", "Public Speaking"]
};

const ALIASES: Record<string, string> = {
  reactjs: "React", "react.js": "React", nodejs: "Node.js", node: "Node.js", "node js": "Node.js", nextjs: "Next.js", vuejs: "Vue", "vue.js": "Vue",
  postgres: "PostgreSQL", k8s: "Kubernetes", js: "JavaScript", ts: "TypeScript", "machine-learning": "Machine Learning", "ml": "Machine Learning",
  golang: "Go", "springboot": "Spring Boot", "ci cd": "CI/CD", "cicd": "CI/CD", "ms excel": "Excel", "microsoft excel": "Excel", "advanced excel": "Excel", "excel formulas": "Excel", expressjs: "Express", "express.js": "Express", swiftui: "Swift", "swift programming": "Swift", pyspark: "Spark", "apache spark": "Spark", "ruby on rails": "Rails", "unity3d": "Unity", "unity engine": "Unity", "embedded systems": "Embedded", "powerbi": "Power BI", "gen ai": "LLM"
};

// Short or ambiguous aliases only count when they stand alone as words, never inside bigger tokens.
const STRICT_ALIASES = new Set(["js", "ts", "ml", "node"]);

const HINT_STOPLIST = new Set([
  "all others", "other", "others", "remote", "worldwide", "anywhere", "full time", "full-time", "part time", "part-time", "contract", "freelance",
  "jobs", "job", "hiring", "urgent", "work from home", "all other"
]);

const ALL_SKILLS: string[] = Array.from(new Set(Object.values(SKILL_GROUPS).flat()));

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termRegex(term: string) {
  // Boundaries that understand C++, C#, .NET, Node.js: a skill must not be glued to other letters/digits.
  return new RegExp(`(?<![a-z0-9+#.])${escapeRegExp(term.toLowerCase())}(?![a-z0-9+#]|\\.[a-z0-9])`, "i");
}

const SKILL_REGEXES = ALL_SKILLS.map((skill) => ({ skill, regex: termRegex(skill) }));
const ALIAS_REGEXES = Object.entries(ALIASES).map(([alias, skill]) => ({ alias, skill, regex: termRegex(alias) }));

export function stripHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/<\s*(br|\/p|\/li|\/div|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export function extractSkills(text: string, hints: unknown[] = [], limit = 25): string[] {
  const haystack = String(text || "");
  const found = new Map<string, string>();

  // Provider tags/categories are trusted hints, but canonicalise them when they are known skills.
  for (const hint of hints) {
    const raw = String(hint || "").trim();
    if (!raw || raw.length > 40 || raw.split(/\s+/).length > 3 || HINT_STOPLIST.has(raw.toLowerCase())) continue;
    const aliased = ALIASES[raw.toLowerCase()];
    const known = aliased ? { skill: aliased } : SKILL_REGEXES.find(({ regex }) => regex.test(raw));
    const key = (known?.skill || raw).toLowerCase();
    if (!found.has(key)) found.set(key, known?.skill || raw);
  }

  for (const { skill, regex } of SKILL_REGEXES) {
    if (regex.test(haystack)) found.set(skill.toLowerCase(), skill);
  }
  for (const { alias, skill, regex } of ALIAS_REGEXES) {
    if (STRICT_ALIASES.has(alias) && !new RegExp(`(?:^|[\\s,;/(])${escapeRegExp(alias)}(?:$|[\\s,;/).])`, "i").test(haystack)) continue;
    if (regex.test(haystack)) found.set(skill.toLowerCase(), skill);
  }
  return Array.from(found.values()).slice(0, limit);
}

export function inferExperience(text: string, title = ""): string {
  const body = `${title}\n${text}`.toLowerCase();

  const range = body.match(/(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)/);
  const plus = body.match(/(\d{1,2})\s*\+\s*(?:years?|yrs?)/);
  const atLeast = body.match(/(?:minimum|min\.?|at least|over)\s*(?:of\s*)?(\d{1,2})\s*(?:years?|yrs?)/);
  const plain = body.match(/(\d{1,2})\s*(?:years?|yrs?)\s*(?:of\s*)?(?:relevant\s*|professional\s*|work\s*|industry\s*)?(?:experience|exp)/);
  const years = range ? Number(range[1]) : plus ? Number(plus[1]) : atLeast ? Number(atLeast[1]) : plain ? Number(plain[1]) : undefined;

  if (years !== undefined && years <= 20) return bucketFromYears(years, /fresher|intern|trainee/.test(body));

  const t = title.toLowerCase();
  if (/\b(intern|internship|trainee|apprentice)\b/.test(t) || /\b(fresher|freshers|entry[- ]level|graduate|new grad|campus)\b/.test(body)) return "0-1 years";
  if (/\b(senior|sr\.?|lead|principal|staff|architect|head of|director|manager)\b/.test(t)) return "5+ years";
  if (/\b(junior|jr\.?|associate)\b/.test(t)) return "0-2 years";
  if (/\b(mid[- ]level|intermediate)\b/.test(body)) return "3-5 years";
  return "Not specified";
}

function bucketFromYears(years: number, fresher: boolean): string {
  if (years <= 0) return fresher ? "0-1 years" : "0-2 years";
  if (years === 1) return "1-3 years";
  if (years === 2) return "2-4 years";
  if (years === 3) return "3-5 years";
  if (years === 4) return "4-6 years";
  return "5+ years";
}

export function inferJobType(text: string, hint?: unknown, title = ""): string {
  const source = `${Array.isArray(hint) ? hint.join(" ") : String(hint || "")} ${title}`.toLowerCase();
  const body = text.toLowerCase();
  const pick = (value: string) => {
    if (/\bintern(ship)?s?\b/.test(value)) return "Internship";
    if (/part[\s_-]?time/.test(value)) return "Part-time";
    if (/freelance/.test(value)) return "Freelance";
    if (/contract|temporary|temp\b/.test(value)) return "Contract";
    if (/full[\s_-]?time|permanent/.test(value)) return "Full-time";
    return "";
  };
  return pick(source) || pick(body.slice(0, 600)) || "Full-time";
}

export function inferRemoteType(text: string, hint?: unknown, title = ""): "Remote" | "Hybrid" | "Onsite" {
  if (hint === true) return "Remote";
  const body = `${title} ${String(hint || "")} ${text}`.toLowerCase();
  if (/\bhybrid\b/.test(body)) return "Hybrid";
  if (/\b(fully remote|100% remote|work from home|wfh|remote[- ]first|remote (position|role|job|opportunity))\b/.test(body)) return "Remote";
  // "On-site role, collaborates with remote teams" is not a remote job.
  if (/\b(on[- ]?site|in[- ]office|office[- ]based|in[- ]person)\b/.test(body)) return "Onsite";
  if (/\bremote\b/.test(body)) return "Remote";
  return "Onsite";
}

export type ParsedSalary = { min?: number; max?: number; currency?: string; period?: "year" | "month" | "hour" };

const CURRENCY_MARKERS: Array<[RegExp, string]> = [
  [/₹|\binr\b|\brs\.?\b|\blpa\b|\blakh|\blac\b/i, "INR"],
  [/€|\beur\b/i, "EUR"],
  [/£|\bgbp\b/i, "GBP"],
  [/\bcad\b|c\$/i, "CAD"],
  [/\baud\b|a\$/i, "AUD"],
  [/\$|\busd\b/i, "USD"]
];

export function parseSalaryText(raw: unknown): ParsedSalary {
  const text = String(raw ?? "").trim();
  if (!text) return {};
  const currency = CURRENCY_MARKERS.find(([regex]) => regex.test(text))?.[1];
  const period: ParsedSalary["period"] = /\/\s*(hr|hour)|per hour|hourly/i.test(text) ? "hour" : /\/\s*(mo|month)|per month|monthly/i.test(text) ? "month" : "year";

  const found: Array<{ value: number; unit: string }> = [];
  for (const match of text.matchAll(/(\d[\d.,]*)\s*(k|m|lpa|lakhs?|lacs?)?(?![a-z])/gi)) {
    let digits = match[1].replace(/[.,]$/, "");
    if (/^\d{1,3}(\.\d{3})+$/.test(digits)) digits = digits.replace(/\./g, "");
    // "35,3k" is a decimal comma (35.3k); "4,000" / "1,200,000" are thousands separators.
    if (/^\d+,\d{1,2}$/.test(digits)) digits = digits.replace(",", ".");
    const value = parseFloat(digits.replace(/,/g, ""));
    if (Number.isFinite(value)) found.push({ value, unit: (match[2] || "").toLowerCase() });
  }
  // "12-18 LPA": the first number inherits the unit written after the second.
  for (let i = 0; i < found.length - 1; i += 1) {
    if (!found[i].unit && found[i + 1].unit && found[i].value < 1000) found[i].unit = found[i + 1].unit;
  }
  const values: number[] = [];
  for (const { value: raw, unit } of found) {
    let value = raw;
    if (unit === "k") value *= 1_000;
    else if (unit === "m") value *= 1_000_000;
    else if (unit) value *= 100_000;
    else if (value < 100 && period === "year") continue; // "2 years" style noise, not a salary
    values.push(value);
  }
  if (values.length === 0) return {};
  const [a, b] = values;
  return { min: Math.min(a, b ?? a), max: Math.max(a, b ?? a), currency, period };
}

export function toAnnual(salary: ParsedSalary): { min?: number; max?: number } {
  const factor = salary.period === "hour" ? 2080 : salary.period === "month" ? 12 : 1;
  return {
    min: salary.min === undefined ? undefined : Math.round(salary.min * factor),
    max: salary.max === undefined ? undefined : Math.round(salary.max * factor)
  };
}

export type EnrichInput = {
  title?: unknown;
  description?: unknown;
  tags?: unknown[];
  jobTypeHint?: unknown;
  remoteHint?: unknown;
  salaryText?: unknown;
  salaryMin?: unknown;
  salaryMax?: unknown;
  defaultCurrency?: string;
};

export function enrichJobFields(input: EnrichInput) {
  const title = stripHtml(input.title);
  const description = stripHtml(input.description);
  const text = `${title}\n${description}`;

  let salaryMin = input.salaryMin !== undefined && input.salaryMin !== null && Number(input.salaryMin) > 0 ? Number(input.salaryMin) : undefined;
  let salaryMax = input.salaryMax !== undefined && input.salaryMax !== null && Number(input.salaryMax) > 0 ? Number(input.salaryMax) : undefined;
  let currency = input.defaultCurrency || "USD";
  if (salaryMin === undefined && salaryMax === undefined && input.salaryText) {
    const parsed = parseSalaryText(input.salaryText);
    const annual = toAnnual(parsed);
    salaryMin = annual.min;
    salaryMax = annual.max;
    if (parsed.currency) currency = parsed.currency;
  }

  return {
    title,
    description,
    skillsRequired: extractSkills(text, input.tags || []),
    experienceRequired: inferExperience(description, title),
    jobType: inferJobType(description, input.jobTypeHint, title),
    remoteType: inferRemoteType(description, input.remoteHint, title),
    salaryMin,
    salaryMax,
    currency
  };
}
