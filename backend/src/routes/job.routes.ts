import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { dailyFeed, getJob, listJobs, saveJob } from "../services/job.service.js";
import { matchJob } from "../services/job-match.service.js";
import { tailorResumeForJob } from "../services/resume-tailor.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.get("/recommended", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await listJobs({ ...req.query, recommendedFor: req.user!.id }) })));
router.get("/daily-feed", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await dailyFeed(req.query) })));
router.get("/", asyncHandler(async (req, res) => res.json({ success: true, data: await listJobs(req.query) })));
router.get("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await getJob(param(req.params.id)) })));
router.post("/:id/save", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await saveJob(req.user!.id, param(req.params.id)) })));
router.post("/:id/match", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await matchJob(req.user!.id, param(req.params.id), req.body.resumeId) })));
router.post("/:id/tailor-resume", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await tailorResumeForJob(req.user!.id, param(req.params.id), req.body.baseResumeId) })));
export default router;
