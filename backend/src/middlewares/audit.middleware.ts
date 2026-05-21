import { NextFunction, Request, Response } from "express";
import { writeAuditLog } from "../services/audit-log.service.js";

function categoryFromPath(path: string) {
  const segment = path.split("/").filter(Boolean)[1] || "api";
  if (segment === "resumes") return "resume";
  if (segment === "jobs") return "jobs";
  if (segment === "applications") return "applications";
  if (segment === "interviews") return "interviews";
  if (segment === "notifications") return "notifications";
  return segment;
}

function actionFromRequest(req: Request) {
  const category = categoryFromPath(req.path);
  const verb = req.method.toLowerCase();
  if (verb === "get") return `${category}.read`;
  if (verb === "post") return `${category}.create`;
  if (verb === "put" || verb === "patch") return `${category}.update`;
  if (verb === "delete") return `${category}.delete`;
  return `${category}.${verb}`;
}

export function auditLogger(req: Request, _res: Response, next: NextFunction) {
  if (req.path.startsWith("/api")) {
    console.info(JSON.stringify({ event: "api_request", method: req.method, path: req.path, userId: req.user?.id || null }));
  }
  _res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;
    const category = categoryFromPath(req.path);
    const sensitive = req.method !== "GET" || ["auth", "admin", "billing", "ai"].includes(category);
    if (!sensitive) return;
    void writeAuditLog({
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      action: actionFromRequest(req),
      category,
      method: req.method,
      path: req.path,
      statusCode: _res.statusCode,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      riskLevel: _res.statusCode >= 400 ? "medium" : "low",
      metadata: { queryKeys: Object.keys(req.query || {}) }
    }).catch((error) => console.error("Audit log write failed", error));
  });
  next();
}
