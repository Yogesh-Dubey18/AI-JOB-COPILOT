import { env, isTest } from "../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const sensitiveKeys = new Set(["password", "passwordHash", "refreshToken", "refreshTokenHash", "token", "authorization", "cookie", "secret", "apiKey", "email"]);
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function shouldLog(level: LogLevel) {
  const configured = (env.LOG_LEVEL || "info") as LogLevel;
  if (isTest && level !== "error") return false;
  return levels[level] >= (levels[configured] || levels.info);
}

function redact(value: unknown): unknown {
  if (typeof value === "string") return value.replace(emailPattern, "[redacted-email]");
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        sensitiveKeys.has(key) ? "[redacted]" : redact(nested)
      ])
    );
  }
  return value;
}

function write(level: LogLevel, event: string, fields: Record<string, unknown> = {}) {
  if (!shouldLog(level)) return;
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(redact(fields) as Record<string, unknown>)
  };
  const line = JSON.stringify(payload);
  if (level === "error") return console.error(line);
  if (level === "warn") return console.warn(line);
  return console.info(line);
}

export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => write("debug", event, fields),
  info: (event: string, fields?: Record<string, unknown>) => write("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => write("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => write("error", event, fields)
};
