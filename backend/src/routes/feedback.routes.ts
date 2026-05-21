import { Router } from "express";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.js";
import { createFeedbackSchema } from "../validators/feedback.validator.js";
import { createFeedback, listMyFeedback } from "../services/feedback.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", optionalAuth, validateBody(createFeedbackSchema), asyncHandler(async (req, res) => {
  const input = { ...req.body, source: req.user ? req.body.source : "public_site" };
  res.status(201).json({ success: true, data: await createFeedback(req.user, input) });
}));

router.get("/mine", requireAuth, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listMyFeedback(req.user!.id) });
}));

export default router;
