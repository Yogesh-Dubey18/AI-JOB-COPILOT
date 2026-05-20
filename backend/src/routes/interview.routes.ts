import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createInterview, getInterview, listInterviews, prepareForInterview } from "../services/interview.service.js";
import { answerMockInterview, startMockInterview } from "../services/mock-interview.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth);
router.post("/", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createInterview(req.user!.id, req.body) })));
router.get("/", asyncHandler(async (req, res) => res.json({ success: true, data: await listInterviews(req.user!.id) })));
router.post("/mock/start", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await startMockInterview(req.user!.id, req.body) })));
router.post("/mock/answer", asyncHandler(async (req, res) => res.json({ success: true, data: await answerMockInterview(req.user!.id, req.body) })));
router.get("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await getInterview(req.user!.id, param(req.params.id)) })));
router.post("/:id/prep", asyncHandler(async (req, res) => res.json({ success: true, data: await prepareForInterview(req.user!.id, param(req.params.id)) })));
export default router;
