export type JobSourceConfig = {
  id: string;
  name: string;
  type: "manual" | "curated" | "company-careers" | "csv";
  trustBaseline: number;
  requiresReview: boolean;
  notes: string;
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
