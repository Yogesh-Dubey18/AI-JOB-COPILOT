import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env, isTest } from "./config/env.js";
import { auditLogger } from "./middlewares/audit.middleware.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { requestLoggingMiddleware } from "./middlewares/request-logging.middleware.js";
import adminRoutes from "./routes/admin.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import authRoutes from "./routes/auth.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import exportRoutes from "./routes/export.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import jobRoutes from "./routes/job.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import privacyRoutes from "./routes/privacy.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import companyResearchRoutes from "./routes/company-research.routes.js";
import answerVaultRoutes from "./routes/answer-vault.routes.js";
import careerVaultRoutes from "./routes/career-vault.routes.js";
import workflowRoutes from "./routes/workflow.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import { getProviderStatus } from "./services/provider-status.service.js";
import { getSystemHealth } from "./services/system-health.service.js";
import { asyncHandler } from "./utils/asyncHandler.js";

export const app = express();
const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(requestIdMiddleware);
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false, skip: () => isTest }));
app.use("/api/ai", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false, skip: () => isTest }));
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", req.method === "GET" && req.path.startsWith("/jobs") ? "private, max-age=30" : "no-store");
  next();
});
app.use(requestLoggingMiddleware);
app.use(auditLogger);

app.get("/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, data: { status: "ok", service: "AI Job Copilot API", uptimeSeconds: Math.round(process.uptime()), timestamp: new Date().toISOString() } });
});
app.get("/ready", asyncHandler(async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const health = await getSystemHealth();
  res.json({ success: true, data: { status: "ready", database: health.database, providers: health.providers, checkedAt: health.checkedAt } });
}));
app.get("/status", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, data: { status: "ok", service: "AI Job Copilot API", providers: getProviderStatus(), uptimeSeconds: Math.round(process.uptime()) } });
});
app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/privacy", privacyRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/company-research", companyResearchRoutes);
app.use("/api/answer-vault", answerVaultRoutes);
app.use("/api/career-vault", careerVaultRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/contacts", contactRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
