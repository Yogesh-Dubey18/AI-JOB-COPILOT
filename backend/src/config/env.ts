import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
  AI_PROVIDER: process.env.AI_PROVIDER || "auto",
  AI_MODEL: process.env.AI_MODEL || "",
  AI_TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS || 12_000),
  AI_RETRY_ATTEMPTS: Number(process.env.AI_RETRY_ATTEMPTS || 1),
  AI_MAX_PROMPT_CHARS: Number(process.env.AI_MAX_PROMPT_CHARS || 20_000),
  AI_SAFETY_MODE: process.env.AI_SAFETY_MODE || "strict",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  REDIS_URL: process.env.REDIS_URL || "",
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "mock",
  EMAIL_HOST: process.env.EMAIL_HOST || "",
  EMAIL_PORT: Number(process.env.EMAIL_PORT || 587),
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "AI Job Copilot <no-reply@example.local>",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "",
  CALENDAR_PROVIDER: process.env.CALENDAR_PROVIDER || "mock",
  GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID || "",
  GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || "",
  BILLING_PROVIDER: process.env.BILLING_PROVIDER || "mock",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO || "",
  STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM || "",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  MONITORING_PROVIDER: process.env.MONITORING_PROVIDER || "noop",
  SENTRY_DSN: process.env.SENTRY_DSN || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || ""
};

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export function validateRuntimeEnv() {
  const warnings: string[] = [];
  const failures: string[] = [];
  if (isProduction) {
    if (!env.MONGO_URI) failures.push("MONGO_URI is required in production.");
    if (env.JWT_ACCESS_SECRET.length < 32 || env.JWT_ACCESS_SECRET.includes("change-me")) failures.push("JWT_ACCESS_SECRET must be a strong production secret.");
    if (env.JWT_REFRESH_SECRET.length < 32 || env.JWT_REFRESH_SECRET.includes("change-me")) failures.push("JWT_REFRESH_SECRET must be a strong production secret.");
    if (!env.CLIENT_URL.startsWith("https://")) warnings.push("CLIENT_URL should use HTTPS in production.");
  } else {
    if (env.JWT_ACCESS_SECRET.includes("change-me")) warnings.push("Using development JWT access secret.");
    if (env.JWT_REFRESH_SECRET.includes("change-me")) warnings.push("Using development JWT refresh secret.");
  }
  return { ok: failures.length === 0, failures, warnings };
}
