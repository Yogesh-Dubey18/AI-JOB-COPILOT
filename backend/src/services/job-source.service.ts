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

export function normalizeJobSourceJob(input: Record<string, any>) {
  const title = String(input.title || "").trim();
  const company = String(input.company || "").trim();
  const location = String(input.location || "Remote").trim();
  const applyUrl = String(input.applyUrl || "").trim();
  return {
    ...input,
    title,
    company,
    location,
    applyUrl,
    duplicateKey: [title, company, location, applyUrl].join("|").toLowerCase()
  };
}

export function scoreSourceTrust(sourceId: string, scamRiskScore = 15) {
  const source = curatedJobSources.find((item) => item.id === sourceId) || curatedJobSources[0];
  return Math.max(0, Math.min(100, source.trustBaseline - Math.round(scamRiskScore / 3)));
}
