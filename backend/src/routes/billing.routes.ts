import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { activateMockPlan, createMockCheckoutSession, getBillingPlans, getBillingSummary } from "../services/billing.service.js";
import { getOrCreateSubscription } from "../services/subscription.service.js";

const router = Router();
router.use(requireAuth);
router.get("/plans", asyncHandler(async (_req, res) => res.json({ success: true, data: await getBillingPlans() })));
router.get("/summary", asyncHandler(async (req, res) => res.json({ success: true, data: await getBillingSummary(req.user!.id) })));
router.get("/subscription", asyncHandler(async (req, res) => res.json({ success: true, data: await getOrCreateSubscription(req.user!.id) })));
router.get("/usage", asyncHandler(async (req, res) => res.json({ success: true, data: (await getBillingSummary(req.user!.id)).usage })));
router.post("/checkout", asyncHandler(async (req, res) => res.json({ success: true, data: await createMockCheckoutSession(req.user!.id, req.body.planId || "pro") })));
router.post("/mock/activate", asyncHandler(async (req, res) => res.json({ success: true, data: await activateMockPlan(req.user!.id, req.body.planId || "pro") })));
export default router;
