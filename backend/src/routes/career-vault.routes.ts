import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.js";
import { createCareerVaultSchema } from "../validators/career-vault.validator.js";
import { createCareerVault, deleteCareerVault, listCareerVault } from "../services/career-vault.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listCareerVault(req.user!.id, {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  }) });
}));

router.post("/", validateBody(createCareerCareerVaultSchemaWrapper()), asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createCareerVault(req.user!.id, req.body) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteCareerVault(req.user!.id, param(req.params.id)) });
}));

// Helper to avoid schema compilation issues
function createCareerCareerVaultSchemaWrapper() {
  return createCareerVaultSchema;
}

export default router;
