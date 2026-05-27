import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createInterview, getInterview, listInterviews, prepareForInterview } from "../services/interview.service.js";
import { answerMockInterview, startMockInterview } from "../services/mock-interview.service.js";
import {
  answerInterviewSession,
  getDsaTracker,
  getHrCoach,
  getInterviewHistory,
  getInterviewReadiness,
  getProjectCoach,
  getQuestionBank,
  startInterviewSession,
  PREP_MODES,
  getPrepQuestionBank,
  getStarTemplate,
  saveStarAnswerToVault,
  getAdvancedInterviewReadiness,
  getInterviewPrepContext
} from "../services/interview-coach.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth);

// ─── Existing routes (backward compat) ─────────────────────────
router.post("/", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createInterview(req.user!.id, req.body) })));
router.get("/", asyncHandler(async (req, res) => res.json({ success: true, data: await listInterviews(req.user!.id) })));
router.get("/readiness", asyncHandler(async (req, res) => res.json({ success: true, data: await getInterviewReadiness(req.user!.id) })));
router.get("/history", asyncHandler(async (req, res) => res.json({ success: true, data: await getInterviewHistory(req.user!.id) })));
router.get("/question-bank/:role", asyncHandler(async (req, res) => res.json({ success: true, data: getQuestionBank(param(req.params.role)) })));
router.get("/coach/project", asyncHandler(async (req, res) => res.json({ success: true, data: getProjectCoach(String(req.query.role || "Full Stack Developer")) })));
router.get("/coach/hr", asyncHandler(async (_req, res) => res.json({ success: true, data: getHrCoach() })));
router.get("/dsa-tracker", asyncHandler(async (req, res) => res.json({ success: true, data: getDsaTracker(String(req.query.role || "Full Stack Developer")) })));
router.post("/sessions/start", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await startInterviewSession(req.user!.id, req.body) })));
router.post("/sessions/answer", asyncHandler(async (req, res) => res.json({ success: true, data: await answerInterviewSession(req.user!.id, req.body) })));
router.post("/mock/start", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await startMockInterview(req.user!.id, req.body) })));
router.post("/mock/answer", asyncHandler(async (req, res) => res.json({ success: true, data: await answerMockInterview(req.user!.id, req.body) })));

// ─── Advanced Interview Prep routes ────────────────────────────
// GET  /interviews/prep/modes         - list of 10 prep modes
router.get("/prep/modes", asyncHandler(async (_req, res) => res.json({ success: true, data: PREP_MODES })));

// GET  /interviews/prep/question-bank/:mode - fallback questions for a mode
router.get("/prep/question-bank/:mode", asyncHandler(async (req, res) => res.json({ success: true, data: getPrepQuestionBank(param(req.params.mode)) })));

// POST /interviews/prep/star-template - return STAR template
router.post("/prep/star-template", asyncHandler(async (req, res) => {
  const { mode, question } = req.body;
  res.json({ success: true, data: getStarTemplate(mode, question) });
}));

// POST /interviews/prep/save-to-vault - save STAR answer to Answer Vault
router.post("/prep/save-to-vault", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await saveStarAnswerToVault(req.user!.id, req.body) });
}));

// GET  /interviews/prep/readiness - advanced heuristic readiness score
router.get("/prep/readiness", asyncHandler(async (req, res) => {
  const jobId = req.query.jobId ? String(req.query.jobId) : undefined;
  const applicationId = req.query.applicationId ? String(req.query.applicationId) : undefined;
  res.json({ success: true, data: await getAdvancedInterviewReadiness(req.user!.id, jobId, applicationId) });
}));

// GET  /interviews/prep/context - job/company context
router.get("/prep/context", asyncHandler(async (req, res) => {
  const jobId = req.query.jobId ? String(req.query.jobId) : undefined;
  const applicationId = req.query.applicationId ? String(req.query.applicationId) : undefined;
  res.json({ success: true, data: await getInterviewPrepContext(req.user!.id, jobId, applicationId) });
}));

// ─── Parameterised routes last (must be below all /prep/* paths) ─
router.get("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await getInterview(req.user!.id, param(req.params.id)) })));
router.post("/:id/prep", asyncHandler(async (req, res) => res.json({ success: true, data: await prepareForInterview(req.user!.id, param(req.params.id)) })));
export default router;
