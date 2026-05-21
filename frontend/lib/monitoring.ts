const provider = process.env.NEXT_PUBLIC_MONITORING_PROVIDER || "noop";
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || "";

export function getFrontendMonitoringStatus() {
  return {
    provider: provider === "sentry" && dsn ? "sentry" : "noop",
    configured: provider === "sentry" && Boolean(dsn)
  };
}

export function captureFrontendException(error: unknown, context: Record<string, unknown> = {}) {
  const status = getFrontendMonitoringStatus();
  if (status.provider === "noop") {
    if (process.env.NODE_ENV !== "production") {
      console.error("Frontend exception captured", { error, context });
    }
    return;
  }
  console.error("Sentry-ready frontend exception", { message: error instanceof Error ? error.message : "Unknown error", context });
}
