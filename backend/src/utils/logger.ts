import { env, isTest } from "../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(level: LogLevel) {
  const configured = (env.LOG_LEVEL || "info") as LogLevel;
  if (isTest && level !== "error") return false;
  return levels[level] >= (levels[configured] || levels.info);
}

function write(level: LogLevel, event: string, fields: Record<string, unknown> = {}) {
  if (!shouldLog(level)) return;
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields
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
