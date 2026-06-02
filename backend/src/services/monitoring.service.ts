import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const isSentryEnabled = env.MONITORING_PROVIDER === "sentry" && env.SENTRY_DSN;

if (isSentryEnabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration()
    ],
    tracesSampleRate: 0.1,
    profilesSampleRate: 1.0,
    environment: env.NODE_ENV
  });
  console.info("Sentry monitoring SDK initialized.");
}

export function getMonitoringStatus() {
  const provider = isSentryEnabled ? "sentry" : "noop";
  return {
    provider,
    configured: isSentryEnabled,
    dsnConfigured: Boolean(env.SENTRY_DSN),
    note: isSentryEnabled ? "Sentry DSN is configured and active." : "No external monitoring provider is configured."
  };
}

export function captureException(error: unknown, context: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;
  
  if (isSentryEnabled) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }

  logger.error("exception_captured", {
    monitoringProvider: isSentryEnabled ? "sentry" : "noop",
    message,
    stack: env.NODE_ENV === "production" ? undefined : stack,
    ...context
  });
}
