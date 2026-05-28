import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

type GitHubProviderStatus = {
  provider: "github";
  status: "live" | "provider_ready" | "fallback" | "not_configured";
  label: string;
  configured: boolean;
  tested: boolean;
  manualFallback: boolean;
  requiredEnvVars: string[];
  configuredVars: string[];
  missingVars: string[];
};

type GitHubRepoMetadata = {
  repoName: string;
  description: string;
  languages: string[];
  readmePresent: boolean;
  lastUpdated: string;
  publicUrl: string;
  defaultBranch: string;
  topics: string[];
};

type GitHubProofResult = {
  repoUrl: string;
  owner: string;
  repo: string;
  providerStatus: GitHubProviderStatus;
  metadata: GitHubRepoMetadata | null;
  evidenceStatus: "evidence_available" | "manual_repo_link" | "self_reported" | "missing";
  confidence: "strong" | "medium" | "weak" | "self-reported";
  keywordMatches: string[];
  checkedAt: string;
  warnings: string[];
};

const requiredEnvVars = ["GITHUB_TOKEN", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"];
const commonWords = new Set([
  "and", "the", "for", "with", "from", "that", "this", "into", "using", "used",
  "app", "web", "site", "project", "system", "built", "build", "user"
]);

function envExists(name: string) {
  return typeof process.env[name] !== "undefined";
}

function configuredVars() {
  return requiredEnvVars.filter((name) => Boolean(process.env[name]));
}

export function getGitHubProviderStatus(options: { tested?: boolean; live?: boolean; manualFallback?: boolean } = {}): GitHubProviderStatus {
  const configured = Boolean(env.GITHUB_TOKEN || (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET));
  const placeholdersExist = requiredEnvVars.some(envExists);
  const manualFallbackAvailable = options.manualFallback !== false;
  const live = Boolean(options.live && configured && options.tested);
  let status: GitHubProviderStatus["status"] = manualFallbackAvailable ? "fallback" : "not_configured";
  let label = manualFallbackAvailable
    ? "Manual GitHub repo URL fallback; no API metadata has been verified."
    : "GitHub API is not configured.";

  if (live) {
    status = "live";
    label = "GitHub API metadata was fetched successfully for this request.";
  } else if (configured || placeholdersExist) {
    status = "provider_ready";
    label = configured
      ? "GitHub credentials are configured; verify API metadata before marking Live."
      : "GitHub env placeholders exist, but credentials are missing.";
  }

  return {
    provider: "github",
    status,
    label,
    configured,
    tested: Boolean(options.tested),
    manualFallback: manualFallbackAvailable && !live,
    requiredEnvVars,
    configuredVars: configuredVars(),
    missingVars: requiredEnvVars.filter((name) => !process.env[name])
  };
}

function canonicalRepoUrl(owner: string, repo: string) {
  return `https://github.com/${owner}/${repo}`;
}

export function parseGitHubRepoUrl(input: unknown) {
  const raw = String(input || "").trim();
  if (!raw) {
    throw new ApiError(400, "GitHub repo URL is required");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ApiError(400, "Enter a valid GitHub repository URL.");
  }

  const host = url.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    throw new ApiError(400, "Only github.com repository URLs are supported.");
  }

  const [owner = "", repoSegment = ""] = url.pathname.split("/").filter(Boolean);
  const repo = repoSegment.replace(/\.git$/i, "");
  const namePattern = /^[a-zA-Z0-9._-]+$/;

  if (!owner || !repo || !namePattern.test(owner) || !namePattern.test(repo)) {
    throw new ApiError(400, "GitHub URL must point to a repository in the form https://github.com/owner/repo.");
  }

  if (["orgs", "topics", "features", "marketplace", "settings", "login"].includes(owner.toLowerCase())) {
    throw new ApiError(400, "GitHub URL must point to a user or organization repository.");
  }

  return {
    owner,
    repo,
    repoUrl: canonicalRepoUrl(owner, repo)
  };
}

function tokensFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(tokensFrom);
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && !commonWords.has(item));
}

export function extractProofKeywords(input: any = {}) {
  return Array.from(new Set([
    ...tokensFrom(input.projectName),
    ...tokensFrom(input.skillName),
    ...tokensFrom(input.keywords),
    ...tokensFrom(input.techStack)
  ])).slice(0, 30);
}

function matchKeywords(metadata: GitHubRepoMetadata | null, keywords: string[]) {
  if (!metadata || !keywords.length) return [];
  const evidence = [
    metadata.repoName,
    metadata.description,
    metadata.defaultBranch,
    ...metadata.languages,
    ...metadata.topics
  ].join(" ").toLowerCase();
  return keywords.filter((keyword) => evidence.includes(keyword.toLowerCase()));
}

export function evaluateProofConfidence(input: {
  repoUrl?: string;
  metadata?: GitHubRepoMetadata | null;
  keywordMatches?: string[];
  selfReported?: boolean;
}) {
  const hasRepo = Boolean(input.repoUrl);
  const metadata = input.metadata || null;
  const matches = input.keywordMatches || [];

  if (metadata && metadata.readmePresent && matches.length > 0) {
    return { confidence: "strong" as const, evidenceStatus: "evidence_available" as const };
  }
  if (hasRepo) {
    return { confidence: "medium" as const, evidenceStatus: "manual_repo_link" as const };
  }
  if (input.selfReported) {
    return { confidence: "self-reported" as const, evidenceStatus: "self_reported" as const };
  }
  return { confidence: "weak" as const, evidenceStatus: "missing" as const };
}

async function githubFetch(path: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-job-copilot-provider-ready"
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (response.status === 404) throw new ApiError(404, "GitHub repository metadata was not found.");
  if (!response.ok) throw new ApiError(502, "GitHub metadata could not be fetched right now.");
  return response.json();
}

async function fetchGitHubMetadata(owner: string, repo: string): Promise<GitHubRepoMetadata | null> {
  if (!env.GITHUB_TOKEN) return null;

  const repoJson = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  const [languagesJson, readmeResult] = await Promise.all([
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`).catch(() => ({})),
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`).then(() => true).catch(() => false)
  ]);

  return {
    repoName: String(repoJson.name || repo),
    description: String(repoJson.description || ""),
    languages: Object.keys(languagesJson || {}),
    readmePresent: Boolean(readmeResult),
    lastUpdated: String(repoJson.updated_at || ""),
    publicUrl: String(repoJson.html_url || canonicalRepoUrl(owner, repo)),
    defaultBranch: String(repoJson.default_branch || ""),
    topics: Array.isArray(repoJson.topics) ? repoJson.topics.map(String) : []
  };
}

function sanitizeStoredMetadata(metadata: any): GitHubRepoMetadata | null {
  if (!metadata || typeof metadata !== "object") return null;
  return {
    repoName: String(metadata.repoName || ""),
    description: String(metadata.description || ""),
    languages: Array.isArray(metadata.languages) ? metadata.languages.map(String).filter(Boolean) : [],
    readmePresent: Boolean(metadata.readmePresent),
    lastUpdated: String(metadata.lastUpdated || ""),
    publicUrl: String(metadata.publicUrl || ""),
    defaultBranch: String(metadata.defaultBranch || ""),
    topics: Array.isArray(metadata.topics) ? metadata.topics.map(String).filter(Boolean) : []
  };
}

function normalizeProviderStatus(value: any): GitHubProviderStatus["status"] {
  return ["live", "provider_ready", "fallback", "not_configured"].includes(value) ? value : "fallback";
}

export function sanitizeGitHubProof(raw: any, fallbackRepoUrl = "") {
  const repoUrl = raw?.repoUrl || fallbackRepoUrl;
  if (!repoUrl) return null;
  let parsed;
  try {
    parsed = parseGitHubRepoUrl(repoUrl);
  } catch {
    return null;
  }
  const metadata = sanitizeStoredMetadata(raw?.metadata);
  const keywordMatches = Array.isArray(raw?.keywordMatches) ? raw.keywordMatches.map(String).filter(Boolean) : [];
  const confidence = ["strong", "medium", "weak", "self-reported"].includes(raw?.confidence) ? raw.confidence : evaluateProofConfidence({
    repoUrl: parsed.repoUrl,
    metadata,
    keywordMatches,
    selfReported: raw?.evidenceStatus === "self_reported"
  }).confidence;
  const evidenceStatus = ["evidence_available", "manual_repo_link", "self_reported", "missing"].includes(raw?.evidenceStatus)
    ? raw.evidenceStatus
    : evaluateProofConfidence({ repoUrl: parsed.repoUrl, metadata, keywordMatches }).evidenceStatus;

  return {
    repoUrl: parsed.repoUrl,
    owner: parsed.owner,
    repo: parsed.repo,
    providerStatus: raw?.providerStatus?.status ? {
      provider: "github",
      status: normalizeProviderStatus(raw.providerStatus.status),
      label: String(raw.providerStatus.label || ""),
      configured: Boolean(raw.providerStatus.configured),
      tested: Boolean(raw.providerStatus.tested),
      manualFallback: raw.providerStatus.manualFallback !== false
    } : getGitHubProviderStatus(),
    metadata,
    evidenceStatus,
    confidence,
    keywordMatches,
    checkedAt: String(raw?.checkedAt || new Date().toISOString()),
    isPublic: Boolean(raw?.isPublic),
    privateNotes: String(raw?.privateNotes || "")
  };
}

export function publicGitHubProof(raw: any) {
  const proof = sanitizeGitHubProof(raw);
  if (!proof || !proof.isPublic) return null;
  const { privateNotes, ...safeProof } = proof;
  return safeProof;
}

export async function checkGitHubProof(input: any = {}): Promise<GitHubProofResult> {
  const parsed = parseGitHubRepoUrl(input.repoUrl);
  const warnings: string[] = [];
  let metadata: GitHubRepoMetadata | null = null;
  let providerStatus = getGitHubProviderStatus();

  if (env.GITHUB_TOKEN) {
    metadata = await fetchGitHubMetadata(parsed.owner, parsed.repo);
    providerStatus = getGitHubProviderStatus({ tested: Boolean(metadata), live: Boolean(metadata) });
  } else {
    warnings.push("GitHub API credentials are not configured. Repo URL is treated as manual/self-reported proof.");
  }

  const keywordMatches = matchKeywords(metadata, extractProofKeywords(input));
  const confidence = evaluateProofConfidence({
    repoUrl: parsed.repoUrl,
    metadata,
    keywordMatches,
    selfReported: Boolean(input.selfReported)
  });

  return {
    repoUrl: parsed.repoUrl,
    owner: parsed.owner,
    repo: parsed.repo,
    providerStatus,
    metadata,
    evidenceStatus: confidence.evidenceStatus,
    confidence: confidence.confidence,
    keywordMatches,
    checkedAt: new Date().toISOString(),
    warnings
  };
}
