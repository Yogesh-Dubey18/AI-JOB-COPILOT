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

router.get("/recommended", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await listJobs({ ...req.query, userId: req.user!.id, recommendedFor: req.user!.id }) })));
router.get("/daily-feed", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await dailyFeed({ ...req.query, userId: req.user!.id }) })));
router.post("/refresh", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await refreshJobs(req.user!.id) })));
router.get("/sync-status", requireAuth, asyncHandler(async (_req, res) => res.json({ success: true, data: await getSyncStatus() })));
router.post("/viewed", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await updateLastJobsViewedAt(req.user!.id) })));
router.post("/manual-import", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createManualJob(req.body) })));
router.post("/parse-text", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await parseJobText(req.body.text || "", req.user?.id) })));
router.post("/import/csv-preview", requireAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await previewCsvJobs(req.body.csv || "") })));
router.get("/sources", asyncHandler(async (_req, res) => res.json({ success: true, data: getJobSources() })));
router.get("/source-grouping", asyncHandler(async (_req, res) => {
  const db = mongoose.connection.db;
  if (!db) {
    return res.json({ success: false, message: "Database not connected" });
  }
  const result = await db.collection("jobs").aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } }
  ]).toArray();
  const grouping: Record<string, number> = {};
  for (const item of result) {
    grouping[item._id || "Unknown"] = item.count;
  }
  res.json({ success: true, data: grouping });
}));
router.get("/ai-errors", asyncHandler(async (_req, res) => {
  const db = mongoose.connection.db;
  if (!db) {
    return res.json({ success: false, message: "Database not connected" });
  }
  const result = await db.collection("airequests").find().sort({ createdAt: -1 }).limit(10).toArray();
  res.json({ success: true, data: result });
}));
router.get("/", optionalAuth, asyncHandler(async (req, res) => res.json({ success: true, data: await listJobs({ ...req.query, userId: req.user?.id }) })));
router.get("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await getJob(param(req.params.id)) })));
router.post("/:id/save", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await saveJob(req.user!.id, param(req.params.id)) })));
router.post("/:id/apply", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await applyJob(req.user!.id, param(req.params.id)) })));
router.post("/:id/match", requireAuth, asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await matchJob(req.user!.id, param(req.params.id), req.body.resumeId) })));
router.post("/:id/tailor-resume", requireAuth, asyncHandler(async (req, res) => {
  const hostUrl = req.protocol + "://" + req.get("host");
  const data = await tailorResumeForJob(req.user!.id, param(req.params.id), req.body.baseResumeId, hostUrl);
  res.status(201).json({ success: true, data });
}));

export default router;
