import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createManualJob, dailyFeed, getJob, getJobSources, listJobs, parseJobText, previewCsvJobs, saveJob, refreshJobs, getSyncStatus, updateLastJobsViewedAt, applyJob } from "../services/job.service.js";
import { matchJob } from "../services/job-match.service.js";
import { tailorResumeForJob } from "../services/resume-tailor.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

router.get("/expired-diagnostics", optionalAuth, asyncHandler(async (req, res) => {
  const now = new Date();
  const db = mongoose.connection.db;
  let dbExpiredCount = 0;
  if (db) {
    dbExpiredCount = await db.collection("jobs").countDocuments({ expiresAt: { $lt: now } });
  }
  const feedJobsResult = await listJobs({ ...req.query, userId: req.user?.id, limit: 100 });
  const feedJobs = feedJobsResult.items || feedJobsResult || [];
  const feedExpiredCount = feedJobs.filter((job: any) => job.expiresAt && new Date(job.expiresAt).getTime() < now.getTime()).length;
  
  res.json({
    success: true,
    data: {
      dbExpiredCount,
      feedExpiredCount,
      now: now.toISOString()
    }
  });
}));

router.get("/test-adzuna", optionalAuth, asyncHandler(async (req, res) => {
  try {
    const { syncAdzunaJobs } = await import("../services/job-providers/adzuna.provider.js");
    const result = await syncAdzunaJobs("developer", "in", 5, 1);
    res.json({ success: true, result });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
}));

router.get("/recommended", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await listJobs({ ...req.query, userId: req.user!.id, recommendedFor: req.user!.id }) })));
router.get("/daily-feed", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await dailyFeed({ ...req.query, userId: req.user!.id }) })));
router.post("/refresh", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await refreshJobs(req.user!.id) })));
router.get("/sync-status", requireAuth, asyncHandler(async (_req, res) => res.json({ success: true, data: await getSyncStatus() })));
router.post("/viewed", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await updateLastJobsViewedAt(req.user!.id) })));
router.post("/manual-import", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createManualJob(req.body) })));
router.post("/parse-text", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await parseJobText(req.body.text || "", req.user?.id) })));
router.post("/import/csv-preview", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await previewCsvJobs(req.body.csv || "") })));
router.get("/sources", asyncHandler(async (_req, res) => res.json({ success: true, data: getJobSources() })));
router.get("/", optionalAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await listJobs({ ...req.query, userId: req.user?.id }) })));
router.get("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await getJob(param(req.params.id)) })));
router.post("/:id/save", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await saveJob(req.user!.id, param(req.params.id)) })));
router.post("/:id/apply", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await applyJob(req.user!.id, param(req.params.id)) })));
router.post("/:id/match", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await matchJob(req.user!.id, param(req.params.id), req.body.resumeId) })));
router.post("/:id/tailor-resume", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await tailorResumeForJob(req.user!.id, param(req.params.id), req.body.baseResumeId) })));

export default router;
