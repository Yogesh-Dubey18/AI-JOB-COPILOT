import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notification.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth);
router.get("/", asyncHandler(async (req, res) => res.json({ success: true, data: await listNotifications(req.user!.id) })));
router.patch("/:id/read", asyncHandler(async (req, res) => res.json({ success: true, data: await markNotificationRead(req.user!.id, param(req.params.id)) })));
router.patch("/read-all", asyncHandler(async (req, res) => res.json({ success: true, data: await markAllNotificationsRead(req.user!.id) })));
export default router;
