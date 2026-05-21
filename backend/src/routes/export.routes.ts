import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { exportApplicationKitPdf, exportInterviewPrepPdf, exportPortfolioPdf, exportResumePdf, exportTailoredResumePdf, getPdfExport, listPdfExports } from "../services/pdf-export.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

router.use(requireAuth);

router.get("/history", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listPdfExports(req.user!.id) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPdfExport(req.user!.id, param(req.params.id)) });
}));

router.post("/resume/:id", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await exportResumePdf(req.user!.id, param(req.params.id)) });
}));

router.post("/tailored-resume/:id", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await exportTailoredResumePdf(req.user!.id, param(req.params.id)) });
}));

router.post("/application-kit/:id", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await exportApplicationKitPdf(req.user!.id, param(req.params.id)) });
}));

router.post("/portfolio/:id", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await exportPortfolioPdf(req.user!.id, param(req.params.id)) });
}));

router.post("/interview-prep/:id", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await exportInterviewPrepPdf(req.user!.id, param(req.params.id)) });
}));

export default router;
