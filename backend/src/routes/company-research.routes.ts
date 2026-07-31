import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.js";
import { createCompanyResearchSchema } from "../validators/company-research.validator.js";
import { createCompanyResearch, deleteCompanyResearch, listCompanyResearch } from "../services/company-research.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listCompanyResearch(req.user!.id, {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  }) });
}));

router.post("/", validateBody(createCompanyResearchSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createCompanyResearch(req.user!.id, req.body) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteCompanyResearch(req.user!.id, param(req.params.id)) });
}));

export default router;
