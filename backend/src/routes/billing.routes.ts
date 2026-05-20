import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createMockCheckoutSession, getBillingSummary } from "../services/billing.service.js";

const router = Router();
router.use(requireAuth);
router.get("/summary", asyncHandler(async (req, res) => res.json({ success: true, data: await getBillingSummary(req.user!.id) })));
router.post("/checkout", asyncHandler(async (req, res) => res.json({ success: true, data: await createMockCheckoutSession(req.user!.id, req.body.planId || "pro") })));
export default router;
