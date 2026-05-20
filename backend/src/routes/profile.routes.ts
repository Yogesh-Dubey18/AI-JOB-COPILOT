import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.js";
import { profileUpdateSchema, skillSchema } from "../validators/profile.validator.js";
import { addSkill, getProfile, removeSkill, updateProfile } from "../services/profile.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth);
router.get("/", asyncHandler(async (req, res) => res.json({ success: true, data: await getProfile(req.user!.id) })));
router.put("/", validateBody(profileUpdateSchema), asyncHandler(async (req, res) => res.json({ success: true, data: await updateProfile(req.user!.id, req.body) })));
router.post("/skills", validateBody(skillSchema), asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await addSkill(req.user!.id, req.body.skill) })));
router.delete("/skills/:skill", asyncHandler(async (req, res) => res.json({ success: true, data: await removeSkill(req.user!.id, param(req.params.skill)) })));
export default router;
