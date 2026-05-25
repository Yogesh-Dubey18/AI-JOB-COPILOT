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
    id: "openai",
    name: "OpenAI / Gemini AI",
    type: "api-provider",
    trustBaseline: 100,
    requiresReview: false,
    envVars: ["OPENAI_API_KEY"],
    capabilities: { search: false, easyApply: false, statusTracking: false, oauthImport: false },
    policy: "Use API keys from OpenAI or Google AI Studio.",
    notes: "AI integration status."
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
  }
];

export function listJobSourceReadiness() {
  return {
    localSources: curatedJobSources,
    externalProviders: externalJobProviders.map((provider) => {
      let isLive = false;
      let status: "live" | "ready" | "not_configured" = "not_configured";

      if (provider.id === "openai") {
        isLive = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
        const openAiExists = typeof process.env.OPENAI_API_KEY !== "undefined";
        const geminiExists = typeof process.env.GEMINI_API_KEY !== "undefined";
        if (isLive) {
          status = "live";
        } else if (openAiExists || geminiExists) {
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

function list(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  return clean(value).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function sourceType(source: string): JobSourceConfig["type"] {
  const lower = source.toLowerCase();
  if (lower.includes("csv")) return "csv";
  if (lower.includes("api")) return "api-provider";
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
    normalizedTitle: normalizeKey(title),
    normalizedCompany: normalizeKey(company),
    reviewStatus: input.reviewStatus || (riskFlags.length ? "needs_review" : "approved"),
    importedAt: input.importedAt || new Date(),
    lastSeenAt: new Date()
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
