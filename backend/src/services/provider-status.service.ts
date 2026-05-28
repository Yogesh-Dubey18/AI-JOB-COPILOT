import { getAiRuntime } from "../ai/aiClient.js";
import { env } from "../config/env.js";
import { getBillingProviderStatus } from "./billing-provider.service.js";
import { getFileScanningProviderStatus } from "./file-scanning.service.js";
import { getGitHubProviderStatus } from "./github-proof.service.js";
import { getMonitoringStatus } from "./monitoring.service.js";
import { getStorageStatus } from "./storage.service.js";

export function getProviderStatus() {
  const ai = getAiRuntime();
  const emailProvider = env.EMAIL_PROVIDER || "mock";
  const calendarProvider = env.CALENDAR_PROVIDER || "mock";
  const storage = getStorageStatus();
  return {
    ai: {
      provider: ai.provider,
      model: ai.model,
      configured: ai.provider !== "mock",
      fallbackEnabled: true,
      timeoutMs: ai.timeoutMs,
      retryAttempts: ai.retryAttempts
    },
    billing: getBillingProviderStatus(),
    email: {
      provider: emailProvider,
      configured:
        emailProvider === "smtp"
          ? Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS)
          : emailProvider === "resend"
            ? Boolean(env.RESEND_API_KEY)
            : emailProvider === "sendgrid"
              ? Boolean(env.SENDGRID_API_KEY)
              : false,
      mockSafe: emailProvider === "mock"
    },
    calendar: {
      provider: calendarProvider,
      configured: calendarProvider === "google" ? Boolean(env.GOOGLE_CALENDAR_CLIENT_ID && env.GOOGLE_CALENDAR_CLIENT_SECRET) : false,
      mockSafe: calendarProvider === "mock"
    },
    monitoring: getMonitoringStatus(),
    storage: {
      ...storage,
      mockSafe: storage.localFallback
    },
    github: getGitHubProviderStatus(),
    fileScanning: getFileScanningProviderStatus()
  };
}
