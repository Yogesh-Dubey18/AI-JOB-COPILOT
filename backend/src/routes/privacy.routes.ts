import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { deleteAccount, exportUserData, getPrivacyPreferences, updatePrivacyPreferences } from "../services/privacy.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get("/export", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await exportUserData(req.user!.id) });
}));

router.get("/preferences", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPrivacyPreferences(req.user!.id) });
}));

router.patch("/preferences", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updatePrivacyPreferences(req.user!.id, req.body) });
}));

router.delete("/account", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteAccount(req.user!.id, req.body?.confirmation) });
}));

export default router;
