import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { portfolioProofUpload } from "../middlewares/upload.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  attachPortfolioFileReference,
  checkSlugAvailability,
  comparePortfolioVersion,
  detachPortfolioFileReference,
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
import {
  createPortfolioFileMetadata,
  deletePortfolioFile,
  getPortfolioFileSignedUrl,
  getPortfolioStorageStatus,
  listPortfolioFiles,
  updatePortfolioFile,
  updatePortfolioFileVisibility,
  uploadPortfolioProofFile
} from "../services/portfolio-file.service.js";

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

router.get("/storage/status", asyncHandler(async (_req, res) => {
  res.json({ success: true, data: getPortfolioStorageStatus() });
}));

router.get("/:id/files", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listPortfolioFiles(req.user!.id, param(req.params.id)) });
}));

router.post("/:id/files/metadata", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createPortfolioFileMetadata(req.user!.id, param(req.params.id), req.body) });
}));

router.post("/:id/files/upload", portfolioProofUpload.single("proofFile"), asyncHandler(async (req, res) => {
  const file = await uploadPortfolioProofFile(req.user!.id, param(req.params.id), req.file, req.body);
  if (file?.projectId || file?.proofMappingId) {
    try {
      await attachPortfolioFileReference(req.user!.id, param(req.params.id), file);
    } catch (error) {
      await deletePortfolioFile(req.user!.id, param(req.params.id), file.fileId);
      throw error;
    }
  }
  res.status(201).json({ success: true, data: file });
}));

router.get("/:id/files/:fileId/signed-url", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPortfolioFileSignedUrl(req.user!.id, param(req.params.id), param(req.params.fileId)) });
}));

router.patch("/:id/files/:fileId", asyncHandler(async (req, res) => {
  const file = "visibility" in req.body && !("projectId" in req.body) && !("proofMappingId" in req.body) && !("fileType" in req.body)
    ? await updatePortfolioFileVisibility(req.user!.id, param(req.params.id), param(req.params.fileId), req.body.visibility)
    : await updatePortfolioFile(req.user!.id, param(req.params.id), param(req.params.fileId), req.body);
  await attachPortfolioFileReference(req.user!.id, param(req.params.id), file);
  res.json({ success: true, data: file });
}));

router.post("/:id/files/:fileId/attach", asyncHandler(async (req, res) => {
  const file = await updatePortfolioFile(req.user!.id, param(req.params.id), param(req.params.fileId), {
    projectId: req.body.projectId,
    proofMappingId: req.body.proofMappingId
  });
  const portfolio = await attachPortfolioFileReference(req.user!.id, param(req.params.id), file);
  res.json({ success: true, data: { file, portfolio } });
}));

router.delete("/:id/files/:fileId", asyncHandler(async (req, res) => {
  await detachPortfolioFileReference(req.user!.id, param(req.params.id), param(req.params.fileId));
  res.json({ success: true, data: await deletePortfolioFile(req.user!.id, param(req.params.id), param(req.params.fileId)) });
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
