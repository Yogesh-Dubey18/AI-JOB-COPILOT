import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.js";
import { createFeedbackSchema } from "../validators/feedback.validator.js";
import { createFeedback, listMyFeedback } from "../services/feedback.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

router.post("/", validateBody(createFeedbackSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createFeedback(req.user!, req.body) });
}));

router.get("/mine", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listMyFeedback(req.user!.id) });
}));

export default router;
