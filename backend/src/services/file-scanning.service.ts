import { env } from "../config/env.js";

export type FileScanStatus = "not_scanned" | "local_validated" | "provider_pending" | "clean" | "blocked" | "failed";

export type FileScanResult = {
  scanStatus: FileScanStatus;
  scanProvider: string;
  scannedAt: string;
  scanSummary: string;
  blockedReason: string;
  isPublicEligible: boolean;
};

type ProviderStatus = {
  provider: string;
  status: "live" | "provider_ready" | "local_validation" | "not_configured";
  label: string;
  configured: boolean;
  tested: boolean;
  live: boolean;
  localValidationActive: boolean;
  providerReady: boolean;
  requiredEnvVars: string[];
  configuredVars: string[];
  missingVars: string[];
  timeoutMs: number;
  localValidationChecks: string[];
};

const requiredEnvVars = ["FILE_SCANNING_PROVIDER", "FILE_SCANNING_API_KEY", "FILE_SCANNING_ENDPOINT"];
const localValidationChecks = [
  "MIME type allowlist",
  "file extension allowlist",
  "5MB size limit",
  "executable signature rejection",
  "magic-number/signature validation"
];

function envExists(name: string) {
  return typeof process.env[name] !== "undefined";
}

function configuredVars() {
  return requiredEnvVars.filter((name) => Boolean(process.env[name]));
}

function hasProviderCredentials() {
  return Boolean(env.FILE_SCANNING_PROVIDER && env.FILE_SCANNING_API_KEY && env.FILE_SCANNING_ENDPOINT);
}

export function isFilePublicEligible(scanStatus: FileScanStatus) {
  return scanStatus === "local_validated" || scanStatus === "clean";
}

export function normalizeScanStatus(value: any): FileScanStatus {
  return ["not_scanned", "local_validated", "provider_pending", "clean", "blocked", "failed"].includes(value)
    ? value
    : "local_validated";
}

export function getFileScanningProviderStatus(options: { tested?: boolean; live?: boolean } = {}): ProviderStatus {
  const configured = hasProviderCredentials();
  const placeholdersExist = requiredEnvVars.some(envExists);
  const live = Boolean(options.live && options.tested && configured);
  let status: ProviderStatus["status"] = "local_validation";
  let label = "Local validation active. Provider malware scanning is not configured.";

  if (live) {
    status = "live";
    label = "File scanning provider returned a verified scan result for this request.";
  } else if (configured || placeholdersExist) {
    status = "provider_ready";
    label = configured
      ? "File scanning credentials are configured; verify a real scan before marking Live."
      : "File scanning env placeholders exist, but credentials or endpoint are missing.";
  } else if (!localValidationChecks.length) {
    status = "not_configured";
    label = "No file scanning or local validation boundary is configured.";
  }

  return {
    provider: env.FILE_SCANNING_PROVIDER || "local-validation",
    status,
    label,
    configured,
    tested: Boolean(options.tested),
    live,
    localValidationActive: true,
    providerReady: configured || placeholdersExist,
    requiredEnvVars,
    configuredVars: configuredVars(),
    missingVars: requiredEnvVars.filter((name) => !process.env[name]),
    timeoutMs: Number.isFinite(env.FILE_SCANNING_TIMEOUT_MS) && env.FILE_SCANNING_TIMEOUT_MS > 0 ? env.FILE_SCANNING_TIMEOUT_MS : 10_000,
    localValidationChecks
  };
}

function localValidatedResult(summary = "Local validation passed. Provider malware scanning is not configured."): FileScanResult {
  return {
    scanStatus: "local_validated",
    scanProvider: "local-validation",
    scannedAt: new Date().toISOString(),
    scanSummary: summary,
    blockedReason: "",
    isPublicEligible: true
  };
}

function failedProviderResult(provider: string, summary = "Provider malware scan could not be completed. File remains private until a clean scan is available."): FileScanResult {
  return {
    scanStatus: "failed",
    scanProvider: provider || "provider",
    scannedAt: new Date().toISOString(),
    scanSummary: summary,
    blockedReason: "provider_scan_failed",
    isPublicEligible: false
  };
}

function normalizeProviderResult(provider: string, payload: any): FileScanResult {
  const rawStatus = String(payload?.scanStatus || payload?.status || "").toLowerCase();
  const blocked = rawStatus === "blocked" || rawStatus === "malicious" || payload?.blocked === true || payload?.clean === false;
  const clean = rawStatus === "clean" || payload?.clean === true;
  const pending = rawStatus === "pending" || rawStatus === "provider_pending";
  const scanStatus: FileScanStatus = blocked ? "blocked" : clean ? "clean" : pending ? "provider_pending" : "failed";
  const blockedReason = blocked
    ? String(payload?.blockedReason || payload?.reason || "provider_reported_file_risk")
    : scanStatus === "failed"
      ? "provider_scan_unrecognized_response"
      : "";

  return {
    scanStatus,
    scanProvider: provider,
    scannedAt: new Date().toISOString(),
    scanSummary: String(payload?.scanSummary || payload?.summary || (
      scanStatus === "clean"
        ? "Provider malware scan returned clean."
        : scanStatus === "blocked"
          ? "Provider malware scan blocked this file."
          : scanStatus === "provider_pending"
            ? "Provider malware scan is pending."
            : "Provider malware scan response was not recognized."
    )),
    blockedReason,
    isPublicEligible: isFilePublicEligible(scanStatus)
  };
}

export async function scanPortfolioProofFileBuffer(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<FileScanResult> {
  const status = getFileScanningProviderStatus();
  if (!hasProviderCredentials()) {
    return localValidatedResult();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), status.timeoutMs);
  try {
    const response = await fetch(env.FILE_SCANNING_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FILE_SCANNING_API_KEY}`
      },
      body: JSON.stringify({
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.buffer.length,
        contentBase64: file.buffer.toString("base64")
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return failedProviderResult(env.FILE_SCANNING_PROVIDER, `Provider malware scan failed with HTTP ${response.status}. File remains private.`);
    }
    return normalizeProviderResult(env.FILE_SCANNING_PROVIDER, payload);
  } catch {
    return failedProviderResult(env.FILE_SCANNING_PROVIDER);
  } finally {
    clearTimeout(timeout);
  }
}
