import { Router } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { activateMockPlan, createMockCheckoutSession, getBillingPlans, getBillingSummary } from "../services/billing.service.js";
import { getOrCreateSubscription, activateSubscription } from "../services/subscription.service.js";

const router = Router();

router.post("/webhook", asyncHandler(async (req: any, res) => {
  const sig = req.headers["stripe-signature"];
  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).json({ error: "Missing signature or webhook secret" });
    return;
  }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    if (userId && planId) {
      await activateSubscription(userId, planId, {
        providerCustomerId: String(session.customer || ""),
        providerSubscriptionId: String(session.subscription || ""),
        provider: "stripe"
      });
    }
  }

  res.json({ received: true });
}));

router.use(requireAuth);
router.get("/plans", asyncHandler(async (_req, res) => res.json({ success: true, data: await getBillingPlans() })));
router.get("/summary", asyncHandler(async (req, res) => res.json({ success: true, data: await getBillingSummary(req.user!.id) })));
router.get("/subscription", asyncHandler(async (req, res) => res.json({ success: true, data: await getOrCreateSubscription(req.user!.id) })));
router.get("/usage", asyncHandler(async (req, res) => res.json({ success: true, data: (await getBillingSummary(req.user!.id)).usage })));
router.post("/checkout", asyncHandler(async (req, res) => res.json({ success: true, data: await createMockCheckoutSession(req.user!.id, req.body.planId || "pro") })));
router.post("/mock/activate", asyncHandler(async (req, res) => res.json({ success: true, data: await activateMockPlan(req.user!.id, req.body.planId || "pro") })));
export default router;
