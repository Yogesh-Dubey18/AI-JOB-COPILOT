import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { exportResumePdfDirect, listPdfExports, generateCompletePdf } from "../services/pdf-export.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.post("/resume", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  // Support both body or query parameter for ID
  const { id } = req.body;
  const targetId = id || req.body.resumeId || req.body.versionId || (req.query.id as string);

  const { buffer } = await exportResumePdfDirect(userId, targetId);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=\"Resume_YogeshDubey.pdf\"");
  res.send(buffer);
}));

router.post("/generate-complete", asyncHandler(async (req, res) => {
  const { resumeData } = req.body;
  const buffer = await generateCompletePdf(resumeData || req.body);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=\"Resume_YogeshDubey.pdf\"");
  res.send(buffer);
}));

router.get("/history", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listPdfExports(req.user!.id) });
}));

export default router;
