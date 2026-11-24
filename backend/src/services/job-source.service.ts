import { getAiRuntime } from "../ai/aiClient.js";

export type JobSourceConfig = {
  id: string;
  name: string;
  type: "manual" | "curated" | "company-careers" | "csv" | "api-provider" | "partner-feed";
  trustBaseline: number;
  requiresReview: boolean;
  notes: string;
};

export type ExternalJobProviderConfig = JobSourceConfig & {
  envVars: string[];
  capabilities: {
    search: boolean;
    easyApply: boolean;
    statusTracking: boolean;
    oauthImport: boolean;
  };
  policy: string;
};

export const curatedJobSources: JobSourceConfig[] = [
  {
    id: "sample-seed-fallback",
    name: "Sample seed fallback",
    type: "curated",
    trustBaseline: 80,
    requiresReview: true,
    notes: "Local demo jobs used when no approved external job source is configured."
  },
  {
    id: "manual-company-careers",
    name: "Manual company careers import",
    type: "company-careers",
    trustBaseline: 90,
    requiresReview: true,
    notes: "User or admin reviews official company career URLs before adding jobs."
  },
  {
    id: "admin-csv-import",
    name: "Admin CSV import",
    type: "csv",
    trustBaseline: 70,
    requiresReview: true,
    notes: "CSV import architecture for approved, legally obtained job lists."
  }
];

export const externalJobProviders: ExternalJobProviderConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn Jobs",
    type: "api-provider",
    trustBaseline: 88,
    requiresReview: true,
    envVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: true },
    policy: "Use official LinkedIn APIs or approved partner access only. Scraping and automatic application submission stay disabled.",
    notes: "Provider-ready OAuth import and profile optimization hooks. Job search/easy apply require approved LinkedIn access."
  },
  {
    id: "indeed",
    name: "Indeed",
    type: "partner-feed",
    trustBaseline: 82,
    requiresReview: true,
    envVars: ["INDEED_API_KEY"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use approved API/feed access only. Do not scrape protected pages.",
    notes: "Configured as a partner-feed placeholder until approved credentials are available."
  },
  {
    id: "ziprecruiter",
    name: "ZipRecruiter",
    type: "api-provider",
    trustBaseline: 82,
    requiresReview: true,
    envVars: ["ZIPRECRUITER_API_KEY"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use public/partner API access and keep applications user-reviewed.",
    notes: "Provider-ready search connector placeholder."
  },
  {
    id: "dice",
    name: "Dice",
    type: "partner-feed",
    trustBaseline: 80,
    requiresReview: true,
    envVars: ["DICE_API_KEY"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use approved feed/API access only.",
    notes: "Technology-role source placeholder."
  },
  {
    id: "naukri",
    name: "Naukri",
    type: "partner-feed",
    trustBaseline: 78,
    requiresReview: true,
    envVars: ["NAUKRI_API_KEY"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use approved partner integration only. Do not scrape protected listings.",
    notes: "India-focused source placeholder for approved integrations."
  },
  {
    id: "google_oauth",
    name: "Google OAuth",
    type: "api-provider",
    trustBaseline: 100,
    requiresReview: false,
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use Google OAuth Console credentials only.",
    notes: "One-click authentication provider."
  },
  {
    id: "ai-engine",
    name: "AI engine",
    type: "api-provider",
    trustBaseline: 100,
    requiresReview: false,
    envVars: [],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "AI keys are configured server-side only (see backend/.env.example) and are never exposed to the browser.",
    notes: "AI engine status. Without a key, AI features run on labelled rule-based fallbacks."
  },
  {
    id: "mongodb",
    name: "MongoDB Atlas",
    type: "api-provider",
    trustBaseline: 100,
    requiresReview: false,
    envVars: ["MONGO_URI"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use MongoDB connection URI.",
    notes: "Primary database config."
  },
  {
    id: "stripe",
    name: "Stripe",
    type: "api-provider",
    trustBaseline: 100,
    requiresReview: false,
    envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use Stripe API keys.",
    notes: "Subscription billing."
  },
  {
    id: "sendgrid",
    name: "SendGrid / Email",
    type: "api-provider",
    trustBaseline: 100,
    requiresReview: false,
    envVars: ["SENDGRID_API_KEY"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use SendGrid API key.",
    notes: "Transactional emails."
  },
  {
    id: "github",
    name: "GitHub API",
    type: "api-provider",
    trustBaseline: 100,
    requiresReview: false,
    envVars: ["GITHUB_TOKEN", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use public repo URLs manually, or GitHub API/OAuth credentials for provider-ready metadata checks. Do not fake stars, forks, commits, or verification.",
    notes: "Portfolio proof metadata and README/language/topic evidence checks. Manual repo URL fallback remains available without credentials."
  },
  {
    id: "file_scanning",
    name: "File Scanning Provider",
    type: "api-provider",
    trustBaseline: 100,
    requiresReview: false,
    envVars: ["FILE_SCANNING_PROVIDER", "FILE_SCANNING_API_KEY", "FILE_SCANNING_ENDPOINT"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use a real malware scanning provider before marking scans Live. Local validation checks file type and signatures only.",
    notes: "Provider-ready boundary for portfolio proof file malware scanning; local validation remains active by default."
  },
  {
    id: "adzuna",
    name: "Adzuna Jobs API",
    type: "api-provider",
    trustBaseline: 85,
    requiresReview: true,
    envVars: ["ADZUNA_APP_ID", "ADZUNA_API_KEY"],
    capabilities: { search: true, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Synchronize approved, developer listings located in India using your Adzuna application credentials. Local dev fallback feed remains operational offline.",
    notes: "Provides developer job listings synchronized from Adzuna APIs."
  },
  {
    id: "remotive",
    name: "Remotive Jobs API",
    type: "api-provider",
    trustBaseline: 85,
    requiresReview: false,
    envVars: [],
    capabilities: { search: true, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Synchronize remote software and tech listings globally using Remotive free tier APIs without credentials.",
    notes: "Remote tech jobs aggregator."
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow Jobs API",
    type: "api-provider",
    trustBaseline: 85,
    requiresReview: false,
    envVars: [],
    capabilities: { search: true, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Synchronize global software development and tech listings using Arbeitnow free tier APIs without credentials.",
    notes: "Global developer jobs aggregator."
  }
];

export function listJobSourceReadiness() {
  return {
    localSources: curatedJobSources,
    externalProviders: externalJobProviders.map((provider) => {
      let isLive = false;
      let status: "live" | "ready" | "not_configured" = "not_configured";

      if (provider.id === "ai-engine") {
        isLive = getAiRuntime().provider !== "mock";
        const keyDeclared = ["OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY"].some((name) => typeof process.env[name] !== "undefined");
        if (isLive) {
          status = "live";
        } else if (keyDeclared) {
          status = "ready";
        } else {
          status = "not_configured";
        }
      } else if (provider.id === "sendgrid") {
        const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);
        const hasSmtp = Boolean((process.env.SMTP_HOST || process.env.EMAIL_HOST) && 
                                (process.env.SMTP_USER || process.env.EMAIL_USER) && 
                                (process.env.SMTP_PASS || process.env.EMAIL_PASS));
        isLive = hasSendGrid || hasSmtp;
        
        const sendgridExists = typeof process.env.SENDGRID_API_KEY !== "undefined";
        const smtpExists = typeof process.env.SMTP_HOST !== "undefined" || typeof process.env.EMAIL_HOST !== "undefined" || typeof process.env.SMTP_USER !== "undefined" || typeof process.env.SMTP_PASS !== "undefined";
        if (isLive) {
          status = "live";
        } else if (sendgridExists || smtpExists) {
          status = "ready";
        } else {
          status = "not_configured";
        }
      } else if (provider.id === "github") {
        const hasCredential = Boolean(process.env.GITHUB_TOKEN || (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET));
        const hasPlaceholder = provider.envVars.some((name) => typeof process.env[name] !== "undefined");
        isLive = false;
        status = hasCredential || hasPlaceholder ? "ready" : "not_configured";
      } else if (provider.id === "file_scanning") {
        const hasCredential = Boolean(process.env.FILE_SCANNING_PROVIDER && process.env.FILE_SCANNING_API_KEY && process.env.FILE_SCANNING_ENDPOINT);
        const hasPlaceholder = provider.envVars.some((name) => typeof process.env[name] !== "undefined");
        isLive = false;
        status = hasCredential || hasPlaceholder ? "ready" : "not_configured";
      } else {
        isLive = provider.envVars.every((name) => Boolean(process.env[name]));
        const allExists = provider.envVars.every((name) => typeof process.env[name] !== "undefined");
        if (isLive) {
          status = "live";
        } else if (allExists || provider.envVars.some((name) => typeof process.env[name] !== "undefined")) {
          status = "ready";
        } else {
          status = "not_configured";
        }
      }

      return {
        ...provider,
        isLive,
        configured: isLive,
        configuredVars: provider.envVars.filter((name) => Boolean(process.env[name])),
        missingVars: provider.envVars.filter((name) => !process.env[name]),
        status
      };
    }),
    safetyRules: [
      "Use official APIs, partner feeds, CSV imports, or user-provided official job URLs only.",
      "Do not scrape protected job boards or bypass terms of service.",
      "Do not auto-apply or auto-message recruiters without explicit user review."
    ]
  };
}

function clean(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function normalizeKey(value: unknown) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

const COMPANY_NOISE = new Set(["pvt", "private", "ltd", "limited", "inc", "incorporated", "llc", "llp", "gmbh", "corp", "corporation", "co", "plc", "ag", "technologies", "technology", "the"]);
const TITLE_NOISE = /\b(m\s*f\s*d|f\s*m\s*d|m\s*w\s*d|all genders|remote|hybrid|urgent|hiring|immediate joiners?)\b/g;
const TITLE_WORDS: Record<string, string> = { sr: "senior", jr: "junior", dev: "developer", eng: "engineer", mgr: "manager" };
const CITY_ALIASES: Record<string, string> = {
  bangalore: "bengaluru", gurgaon: "gurugram", bombay: "mumbai", "new delhi": "delhi", madras: "chennai", calcutta: "kolkata",
  "navi mumbai": "mumbai", noida: "noida", worldwide: "remote", anywhere: "remote", global: "remote", remote: "remote"
};

/**
 * Source-independent identity for a vacancy: the same job listed on Adzuna, Remotive and a careers
 * page maps to one key ("Sr. Developer @ Acme Pvt Ltd, Bangalore, India" === "Senior Developer @ ACME, Bengaluru").
 */
export function canonicalJobKey(titleInput: unknown, companyInput: unknown, locationInput: unknown) {
  const title = normalizeKey(clean(titleInput).replace(/\([^)]*\)|\[[^\]]*\]/g, " "))
    .replace(TITLE_NOISE, " ")
    .split(" ")
    .map((word) => TITLE_WORDS[word] || word)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const company = normalizeKey(companyInput).split(" ").filter((word) => word && !COMPANY_NOISE.has(word)).join(" ");
  const firstPart = clean(locationInput).split(",")[0] || "";
  const city = normalizeKey(firstPart);
  const location = CITY_ALIASES[city] || city || "remote";
  if (!title || !company) return "";
  return [title, company, location].join("|");
}

/**
 * Merge a freshly seen listing into an existing job. Same source: the new data wins (a refresh).
 * Different source (or preferIncoming=false): the existing record stays primary and only gaps are filled,
 * while the other listing is remembered in alternateSources so users keep every apply link.
 */
export function mergeJobRecords(existing: Record<string, any>, incoming: Record<string, any>, options: { preferIncoming?: boolean } = {}) {
  const { _id: _a, createdAt: _b, __v: _c, ...base } = existing as any;
  const { _id: _d, createdAt: _e, __v: _f, alternateSources: incomingAlternates, ...fresh } = incoming as any;
  const sameSource = existing.source === incoming.source;
  const alternates: Array<{ source?: string; applyUrl?: string; seenAt?: Date }> = [...(existing.alternateSources || [])];
  const addAlternate = (entry: { source?: string; applyUrl?: string; seenAt?: Date }) => {
    if (!entry.source && !entry.applyUrl) return;
    if (entry.source === existing.source && entry.applyUrl === existing.applyUrl) return;
    if (alternates.some((item) => item.source === entry.source && item.applyUrl === entry.applyUrl)) return;
    alternates.push({ source: entry.source, applyUrl: entry.applyUrl, seenAt: entry.seenAt || new Date() });
  };
  if (!sameSource) addAlternate({ source: incoming.source, applyUrl: incoming.applyUrl });
  for (const entry of incomingAlternates || []) addAlternate(entry);

  const longer = <T,>(a: T[] | undefined, b: T[] | undefined) => ((b || []).length > (a || []).length ? b : a) || [];
  const union = (a: string[] | undefined, b: string[] | undefined) => Array.from(new Set([...(a || []), ...(b || [])]));
  const known = (value: unknown) => value !== undefined && value !== null && value !== "" && value !== "Not specified";

  const prefer = sameSource && options.preferIncoming !== false;
  const merged: Record<string, any> = prefer
    ? { ...base, ...fresh }
    : {
        ...base,
        description: clean(fresh.description).length > clean(base.description).length ? fresh.description : base.description,
        salaryMin: known(base.salaryMin) ? base.salaryMin : fresh.salaryMin,
        salaryMax: known(base.salaryMax) ? base.salaryMax : fresh.salaryMax,
        currency: known(base.salaryMin) || !known(fresh.salaryMin) ? base.currency : fresh.currency,
        experienceRequired: known(base.experienceRequired) ? base.experienceRequired : fresh.experienceRequired || base.experienceRequired,
        jobType: base.jobType || fresh.jobType,
        remoteType: base.remoteType || fresh.remoteType,
        responsibilities: longer(base.responsibilities, fresh.responsibilities),
        requirements: longer(base.requirements, fresh.requirements),
        postedAt: base.postedAt && fresh.postedAt ? (new Date(base.postedAt) < new Date(fresh.postedAt) ? base.postedAt : fresh.postedAt) : base.postedAt || fresh.postedAt,
        expiresAt: base.expiresAt && fresh.expiresAt ? (new Date(base.expiresAt) > new Date(fresh.expiresAt) ? base.expiresAt : fresh.expiresAt) : base.expiresAt || fresh.expiresAt
      };
  if (prefer) {
    // A refresh of the same listing: its own latest data (including risk signals) is the truth.
    merged.skillsRequired = fresh.skillsRequired ?? base.skillsRequired;
    merged.riskFlags = fresh.riskFlags ?? base.riskFlags;
    merged.scamRiskScore = fresh.scamRiskScore ?? base.scamRiskScore;
    merged.trustScore = fresh.trustScore ?? base.trustScore;
  } else {
    merged.skillsRequired = union(base.skillsRequired, fresh.skillsRequired);
    merged.riskFlags = union(base.riskFlags, fresh.riskFlags);
    merged.scamRiskScore = Math.max(Number(base.scamRiskScore ?? 0), Number(fresh.scamRiskScore ?? 0)) || merged.scamRiskScore;
    merged.trustScore = Math.max(Number(base.trustScore ?? 0), Number(fresh.trustScore ?? 0));
    // A listing that brings new risk signals must not stay silently "approved".
    if (merged.riskFlags.length > (base.riskFlags || []).length) merged.reviewStatus = "needs_review";
  }
  merged.canonicalKey = fresh.canonicalKey || base.canonicalKey;
  merged.alternateSources = alternates;
  merged.lastSeenInSyncAt = new Date();
  merged.updatedAt = new Date();
  return merged;
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  return clean(value).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function sourceType(source: string): JobSourceConfig["type"] {
  const lower = source.toLowerCase();
  if (lower.includes("csv")) return "csv";
  if (lower.includes("api") || lower.includes("remotive") || lower.includes("arbeitnow") || lower.includes("adzuna")) return "api-provider";
  if (lower.includes("partner")) return "partner-feed";
  if (lower.includes("career")) return "company-careers";
  if (lower.includes("manual")) return "manual";
  return "curated";
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function detectJobRiskFlags(input: Record<string, any>) {
  const description = clean(input.description).toLowerCase();
  const recruiterEmail = clean(input.recruiterEmail).toLowerCase();
  const applyUrl = clean(input.applyUrl);
  const salaryMax = Number(input.salaryMax || 0);
  const flags = [
    /registration fee|processing fee|security deposit|pay.*training|paid training/i.test(description) ? "Payment or registration fee language detected." : "",
    /gmail\.com|yahoo\.com|outlook\.com|hotmail\.com/.test(recruiterEmail) ? "Recruiter email uses a personal email domain." : "",
    salaryMax > 2500000 && /fresher|0-1|0-2/i.test(clean(input.experienceRequired)) ? "Salary looks unusually high for the stated experience." : "",
    !applyUrl ? "Official apply URL is missing." : "",
    applyUrl && !/^https?:\/\//i.test(applyUrl) ? "Apply URL is not a valid HTTP/HTTPS URL." : ""
  ].filter(Boolean);
  return flags;
}

export function normalizeJobSourceJob(input: Record<string, any>) {
  const title = String(input.title || "").trim();
  const company = String(input.company || "").trim();
  const location = String(input.location || "Remote").trim();
  const applyUrl = String(input.applyUrl || "").trim();
  const source = clean(input.source, "Manual import");
  const riskFlags = detectJobRiskFlags(input);
  const scamRiskScore = Math.min(100, Number(input.scamRiskScore ?? 8) + riskFlags.length * 14);
  const trustScore = scoreSourceTrust(source, scamRiskScore, Boolean(applyUrl), Boolean(input.companyWebsite));
  const duplicateKey = [normalizeKey(title), normalizeKey(company), normalizeKey(location), hostFromUrl(applyUrl) || normalizeKey(applyUrl)].join("|");
  return {
    ...input,
    title,
    company,
    location,
    applyUrl,
    source,
    sourceType: sourceType(source),
    skillsRequired: list(input.skillsRequired),
    responsibilities: list(input.responsibilities),
    requirements: list(input.requirements),
    trustScore,
    scamRiskScore,
    riskFlags,
    duplicateKey,
    canonicalKey: canonicalJobKey(title, company, location),
    normalizedTitle: normalizeKey(title),
    normalizedCompany: normalizeKey(company),
    reviewStatus: input.reviewStatus || (riskFlags.length ? "needs_review" : "approved"),
    importedAt: input.importedAt || new Date(),
    lastSeenAt: new Date(),
    lastSeenInSyncAt: input.lastSeenInSyncAt || new Date()
  };
}

export function scoreSourceTrust(sourceIdOrName: string, scamRiskScore = 15, hasApplyUrl = true, hasCompanyWebsite = false) {
  const source = curatedJobSources.find((item) => item.id === sourceIdOrName || item.name === sourceIdOrName) || curatedJobSources.find((item) => item.type === sourceType(sourceIdOrName)) || curatedJobSources[0];
  const evidenceBoost = (hasApplyUrl ? 6 : -12) + (hasCompanyWebsite ? 4 : 0);
  return Math.max(0, Math.min(100, source.trustBaseline + evidenceBoost - Math.round(scamRiskScore / 3)));
}

export function parseCsvPreview(csv: string) {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headers = (lines.shift() || "").split(",").map((header) => header.trim());
  return lines.slice(0, 25).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
    return normalizeJobSourceJob({ ...row, source: row.source || "CSV preview" });
  });
}
