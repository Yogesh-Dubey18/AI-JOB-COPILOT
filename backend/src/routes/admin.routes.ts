import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { syncAdzunaJobs } from "../services/job-providers/adzuna.provider.js";
import { aiUsage, auditLogs, createAdminJob, deleteAdminJob, feedback, listAdminJobs, listUsers, monitoringStatus, reports, riskSignals, systemHealth, updateAdminJob, usageAnalytics } from "../services/admin.service.js";
import { createFeedbackIssueDraft, updateFeedbackTriage } from "../services/feedback.service.js";
import { getMaintenanceRun, listMaintenanceRuns } from "../services/maintenance-run.service.js";
import { cleanupExpiredPortfolioProofArchives } from "../services/portfolio-file-export.service.js";
import { updateFeedbackSchema } from "../validators/feedback.validator.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth, requireAdmin);
router.get("/users", asyncHandler(async (_req, res) => res.json({ success: true, data: await listUsers() })));
router.get("/jobs", asyncHandler(async (_req, res) => res.json({ success: true, data: await listAdminJobs() })));
router.post("/jobs", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createAdminJob(req.body) })));
router.put("/jobs/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await updateAdminJob(param(req.params.id), req.body) })));
router.delete("/jobs/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await deleteAdminJob(param(req.params.id)) })));
router.get("/ai-usage", asyncHandler(async (_req, res) => res.json({ success: true, data: await aiUsage() })));
router.get("/audit-logs", asyncHandler(async (_req, res) => res.json({ success: true, data: await auditLogs() })));
router.get("/system-health", asyncHandler(async (_req, res) => res.json({ success: true, data: await systemHealth() })));
router.get("/monitoring", asyncHandler(async (_req, res) => res.json({ success: true, data: await monitoringStatus() })));
router.get("/risk-signals", asyncHandler(async (_req, res) => res.json({ success: true, data: await riskSignals() })));
router.get("/usage-analytics", asyncHandler(async (_req, res) => res.json({ success: true, data: await usageAnalytics() })));
router.get("/reports", asyncHandler(async (_req, res) => res.json({ success: true, data: await reports() })));
router.get("/maintenance/runs", asyncHandler(async (req, res) => res.json({ success: true, data: await listMaintenanceRuns(req.query) })));
router.get("/maintenance/runs/:runId", asyncHandler(async (req, res) => res.json({ success: true, data: await getMaintenanceRun(param(req.params.runId)) })));
router.post("/maintenance/proof-archives/cleanup", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await cleanupExpiredPortfolioProofArchives({
    limit: req.body?.limit ?? req.query.limit,
    triggeredBy: "admin",
    actorUserId: req.user?.id,
    actorRole: req.user?.role
  }) });
}));
router.post("/jobs/sync", asyncHandler(async (req, res) => {
  const result = await syncAdzunaJobs(
    req.body.what || "developer",
    req.body.country || "in",
    req.body.limit || 15
  );
  res.json({ success: true, data: result });
}));
router.get("/feedback", asyncHandler(async (_req, res) => res.json({ success: true, data: await feedback() })));
router.patch("/feedback/:id", validateBody(updateFeedbackSchema), asyncHandler(async (req, res) => res.json({ success: true, data: await updateFeedbackTriage(param(req.params.id), req.body) })));
router.post("/feedback/:id/issue-draft", asyncHandler(async (req, res) => res.json({ success: true, data: await createFeedbackIssueDraft(param(req.params.id)) })));
export default router;
