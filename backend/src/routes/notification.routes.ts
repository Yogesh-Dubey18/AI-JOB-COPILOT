import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getNotificationPreferences, listNotifications, markAllNotificationsRead, markNotificationRead, updateNotificationPreferences } from "../services/notification.service.js";
import { runApplicationReminderScan } from "../services/reminder-scheduler.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth);
router.get("/", asyncHandler(async (req, res) => res.json({ success: true, data: await listNotifications(req.user!.id) })));
router.get("/preferences", asyncHandler(async (req, res) => res.json({ success: true, data: await getNotificationPreferences(req.user!.id) })));
router.patch("/preferences", asyncHandler(async (req, res) => res.json({ success: true, data: await updateNotificationPreferences(req.user!.id, req.body) })));
router.post("/reminders/applications", asyncHandler(async (req, res) => res.json({ success: true, data: await runApplicationReminderScan(req.user!.id) })));
router.patch("/read-all", asyncHandler(async (req, res) => res.json({ success: true, data: await markAllNotificationsRead(req.user!.id) })));
router.patch("/:id/read", asyncHandler(async (req, res) => res.json({ success: true, data: await markNotificationRead(req.user!.id, param(req.params.id)) })));
export default router;
