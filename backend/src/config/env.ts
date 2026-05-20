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
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  REDIS_URL: process.env.REDIS_URL || "",
  EMAIL_HOST: process.env.EMAIL_HOST || "",
  EMAIL_PORT: Number(process.env.EMAIL_PORT || 587),
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "AI Job Copilot <no-reply@example.local>",
  LOG_LEVEL: process.env.LOG_LEVEL || "info"
};

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
