import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createApplication, deleteApplication, getApplication, listApplications, updateApplication, updateApplicationStatus } from "../services/application.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth);
router.post("/", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createApplication(req.user!.id, req.body) })));
router.get("/", asyncHandler(async (req, res) => res.json({ success: true, data: await listApplications(req.user!.id) })));
router.get("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await getApplication(req.user!.id, param(req.params.id)) })));
router.patch("/:id/status", asyncHandler(async (req, res) => res.json({ success: true, data: await updateApplicationStatus(req.user!.id, param(req.params.id), req.body.status) })));
router.patch("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await updateApplication(req.user!.id, param(req.params.id), req.body) })));
router.delete("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await deleteApplication(req.user!.id, param(req.params.id)) })));
export default router;
