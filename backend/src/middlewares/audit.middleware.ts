import { NextFunction, Request, Response } from "express";
import { writeAuditLog } from "../services/audit-log.service.js";
import { logger } from "../utils/logger.js";

function categoryFromPath(path: string) {
  const segment = path.split("/").filter(Boolean)[1] || "api";
  if (segment === "resumes") return "resume";
  if (segment === "jobs") return "jobs";
  if (segment === "applications") return "applications";
  if (segment === "interviews") return "interviews";
  if (segment === "notifications") return "notifications";
  return segment;
}

function actionFromRequest(req: Request, path: string) {
  const category = categoryFromPath(path);
  const verb = req.method.toLowerCase();
  if (verb === "get") return `${category}.read`;
  if (verb === "post") return `${category}.create`;
  if (verb === "put" || verb === "patch") return `${category}.update`;
  if (verb === "delete") return `${category}.delete`;
  return `${category}.${verb}`;
}

export function auditLogger(req: Request, _res: Response, next: NextFunction) {
  const requestPath = req.originalUrl.split("?")[0] || req.path;
  if (requestPath.startsWith("/api")) {
    logger.info("api_request", { requestId: req.requestId, method: req.method, path: requestPath, userId: req.user?.id || null });
  }
  _res.on("finish", () => {
    if (!requestPath.startsWith("/api")) return;
    const category = categoryFromPath(requestPath);
    const sensitive = req.method !== "GET" || ["auth", "admin", "billing", "ai"].includes(category);
    if (!sensitive) return;
    void writeAuditLog({
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      action: actionFromRequest(req, requestPath),
      category,
      method: req.method,
      path: requestPath,
      statusCode: _res.statusCode,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      riskLevel: _res.statusCode >= 400 ? "medium" : "low",
      metadata: { queryKeys: Object.keys(req.query || {}) }
    }).catch((error) => logger.error("audit_log_write_failed", { requestId: req.requestId, message: error instanceof Error ? error.message : "Unknown audit error" }));
  });
  next();
}
