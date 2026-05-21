import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAnalyticsOverview } from "../services/analytics.service.js";
import { getJobSearchIntelligence } from "../services/job-search-intelligence.service.js";

const router = Router();
router.use(requireAuth);
router.get("/overview", asyncHandler(async (req, res) => res.json({ success: true, data: await getAnalyticsOverview(req.user!.id) })));
router.get("/applications", asyncHandler(async (req, res) => res.json({ success: true, data: (await getAnalyticsOverview(req.user!.id)).applicationStatusChart })));
router.get("/resume-score", asyncHandler(async (req, res) => res.json({ success: true, data: (await getAnalyticsOverview(req.user!.id)).resumeScoreTrend })));
router.get("/skills", asyncHandler(async (req, res) => res.json({ success: true, data: (await getAnalyticsOverview(req.user!.id)).mostMissingSkills })));
router.get("/job-search-intelligence", asyncHandler(async (req, res) => res.json({ success: true, data: await getJobSearchIntelligence(req.user!.id) })));
export default router;
