import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export function getMonitoringStatus() {
  const provider = env.MONITORING_PROVIDER === "sentry" && env.SENTRY_DSN ? "sentry" : "noop";
  return {
    provider,
    configured: provider === "sentry",
    dsnConfigured: Boolean(env.SENTRY_DSN),
    note: provider === "sentry" ? "Sentry DSN is configured; SDK wiring can be enabled during deployment." : "No external monitoring provider is configured."
  };
}

export function captureException(error: unknown, context: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error("exception_captured", {
    monitoringProvider: getMonitoringStatus().provider,
    message,
    stack: env.NODE_ENV === "production" ? undefined : stack,
    ...context
  });
}
