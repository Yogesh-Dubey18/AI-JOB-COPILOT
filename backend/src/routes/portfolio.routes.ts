import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  checkSlugAvailability,
  comparePortfolioVersion,
  generatePortfolio,
  getPortfolio,
  listPortfolioVersions,
  listPortfolios,
  publishPortfolio,
  restorePortfolioVersion,
  savePortfolioVersion,
  updatePortfolio
} from "../services/portfolio.service.js";
import { getPublicProfileBySlug } from "../services/public-profile.service.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

router.get("/public/:slug", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPublicProfileBySlug(param(req.params.slug)) });
}));

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listPortfolios(req.user!.id) });
}));

router.get("/slug/:slug", asyncHandler(async (req, res) => {
  const portfolioId = Array.isArray(req.query.portfolioId) ? req.query.portfolioId[0] : req.query.portfolioId;
  res.json({ success: true, data: await checkSlugAvailability(param(req.params.slug), typeof portfolioId === "string" ? portfolioId : undefined) });
}));

router.post("/generate", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await generatePortfolio(req.user!.id, req.body) });
}));

router.get("/:id/versions", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listPortfolioVersions(req.user!.id, param(req.params.id)) });
}));

router.post("/:id/versions", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await savePortfolioVersion(req.user!.id, param(req.params.id), req.body) });
}));

router.get("/:id/versions/:versionId/compare", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await comparePortfolioVersion(req.user!.id, param(req.params.id), param(req.params.versionId)) });
}));

router.post("/:id/versions/:versionId/restore", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await restorePortfolioVersion(req.user!.id, param(req.params.id), param(req.params.versionId), req.body) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPortfolio(req.user!.id, param(req.params.id)) });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updatePortfolio(req.user!.id, param(req.params.id), req.body) });
}));

router.post("/:id/publish", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await publishPortfolio(req.user!.id, param(req.params.id), req.body) });
}));

export default router;
