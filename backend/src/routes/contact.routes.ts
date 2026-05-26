import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createContact, deleteContact, listContacts } from "../services/contact.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listContacts(req.user!.id) });
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createContact(req.user!.id, req.body) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteContact(req.user!.id, param(req.params.id)) });
}));

export default router;
