import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generatePortfolio, getPortfolio, listPortfolios, publishPortfolio, updatePortfolio } from "../services/portfolio.service.js";
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

router.post("/generate", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await generatePortfolio(req.user!.id, req.body) });
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
