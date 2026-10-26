import "./services/monitoring.service.js";
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
import { agentTraceMiddleware } from "./agents/trace.js";
import { requestLoggingMiddleware } from "./middlewares/request-logging.middleware.js";
import adminRoutes from "./routes/admin.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import authRoutes from "./routes/auth.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import exportRoutes from "./routes/export.routes.js";
import pdfExportRouter from "./routes/pdf-export.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import jobRoutes from "./routes/job.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import privacyRoutes from "./routes/privacy.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import { downloadFile, normalizeStorageKey, verifyStorageDownloadSignature } from "./services/storage.service.js";
import { findOneRecord } from "./utils/repository.js";
import companyResearchRoutes from "./routes/company-research.routes.js";
import answerVaultRoutes from "./routes/answer-vault.routes.js";
import careerVaultRoutes from "./routes/career-vault.routes.js";
import workflowRoutes from "./routes/workflow.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import demoRoutes from "./routes/demo.routes.js";
import { getProviderStatus } from "./services/provider-status.service.js";
import { getSystemHealth } from "./services/system-health.service.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { ApiError } from "./utils/ApiError.js";

export const app = express();
const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
// Number of reverse proxies in front of the API (Render = 1; Vercel rewrite -> Render = 2).
// Too low makes all users share one rate-limit bucket; too high lets clients spoof their IP.
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || "1", 10);
app.set("trust proxy", Number.isFinite(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1);
app.use(helmet());
app.use(requestIdMiddleware);
app.use(cors({
  credentials: true,
  // Lets cross-origin frontends read whether a result came from a live model or a fallback.
  exposedHeaders: ["X-AI-Mode", "X-AI-Agents", "X-AI-Fallback-Agents", "X-Request-Id"],
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(cookieParser());
app.use(express.json({
  limit: "1mb",
  verify: (req: any, _res, buf) => {
    if (req.originalUrl && req.originalUrl.includes("/billing/webhook")) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false, skip: () => isTest }));
app.use("/api/ai", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false, skip: () => isTest }));
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(requestLoggingMiddleware);
app.use("/api", agentTraceMiddleware);
app.use(auditLogger);

app.get(["/health", "/api/health"], (_req, res) => {
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

app.get("/api/storage/download", asyncHandler(async (req, res) => {
  const key = typeof req.query.key === "string" ? req.query.key : "";
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : "";
  const expiresAt = req.query.expiresAt;
  const signature = req.query.signature;
  if (!verifyStorageDownloadSignature(key, ownerId, expiresAt, signature)) {
    throw new ApiError(403, "Download link is invalid or expired");
  }

  const safeKey = normalizeStorageKey(key);
  const ownedResume = await findOneRecord("resumes", { userId: ownerId, fileUrl: safeKey });
  const ownedVersion = await findOneRecord("resumeVersions", { userId: ownerId, pdfUrl: safeKey });
  const ownedExport = await findOneRecord("pdfExports", { userId: ownerId, fileUrl: safeKey, status: "ready" });
  const ownedProof = await findOneRecord("portfolioFiles", { ownerId, storageKey: safeKey, retentionStatus: "active", scanStatus: { $ne: "blocked" } });
  const publicProof = await findOneRecord("portfolioFiles", {
    storageKey: safeKey,
    visibility: "publicApproved",
    isPublicEligible: true,
    retentionStatus: "active",
    scanStatus: { $in: ["clean", "local_validated"] }
  });
  const ownedArchive = await findOneRecord("portfolioFileExportRequests", {
    ownerId,
    archiveStorageKey: safeKey,
    status: "ready"
  });
  const archiveIsCurrent = ownedArchive && (!ownedArchive.expiresAt || new Date(ownedArchive.expiresAt).getTime() > Date.now());
  if (!ownedResume && !ownedVersion && !ownedExport && !ownedProof && !publicProof && !archiveIsCurrent) {
    throw new ApiError(404, "File not found");
  }

  let content: Buffer;
  try {
    content = await downloadFile(safeKey);
  } catch {
    throw new ApiError(404, "File is unavailable");
  }

  const fileName = path.basename(key).replace(/[\r\n"\\]/g, "_");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(content);
}));

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/pdf-export", pdfExportRouter);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/resume-examples", resumeRoutes);
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
app.use("/api/demo", demoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
