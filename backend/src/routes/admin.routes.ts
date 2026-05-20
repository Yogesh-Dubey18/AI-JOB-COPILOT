import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { aiUsage, createAdminJob, deleteAdminJob, feedback, listAdminJobs, listUsers, reports, updateAdminJob } from "../services/admin.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth, requireAdmin);
router.get("/users", asyncHandler(async (_req, res) => res.json({ success: true, data: await listUsers() })));
router.get("/jobs", asyncHandler(async (_req, res) => res.json({ success: true, data: await listAdminJobs() })));
router.post("/jobs", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createAdminJob(req.body) })));
router.put("/jobs/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await updateAdminJob(param(req.params.id), req.body) })));
router.delete("/jobs/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await deleteAdminJob(param(req.params.id)) })));
router.get("/ai-usage", asyncHandler(async (_req, res) => res.json({ success: true, data: await aiUsage() })));
router.get("/reports", asyncHandler(async (_req, res) => res.json({ success: true, data: await reports() })));
router.get("/feedback", asyncHandler(async (_req, res) => res.json({ success: true, data: await feedback() })));
export default router;
