import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { resumeUpload } from "../middlewares/upload.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { analyzeResume, improveResume } from "../services/resume-analysis.service.js";
import { getResume, getResumeVersion, listResumeVersions, listResumes, updateResumeParsedData, uploadResume } from "../services/resume.service.js";
import { exportResumePdf } from "../services/pdf-export.service.js";
import { scoreResumeForRole, scoreResumeAgainstJobDescription } from "../services/ats-scoring.service.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
router.use(requireAuth);

router.post("/score-draft", asyncHandler(async (req, res) => {
  const { parsedData, targetRole, jobDescription } = req.body;
  if (!parsedData) {
    throw new ApiError(400, "parsedData is required for draft scoring");
  }

  // Reconstruct representative rawText from the edited parsedData structure
  const summaryText = parsedData.summary || "";
  const skillsText = (parsedData.skills || []).join(", ");
  const projectsText = (parsedData.projects || [])
    .map((p: any) => `${p.name || ""} ${p.technologies || ""} ${Array.isArray(p.bullets) ? p.bullets.join(" ") : ""}`)
    .join(" ");
  const experienceText = (parsedData.experience || [])
    .map((e: any) => `${e.company || ""} ${e.role || ""} ${Array.isArray(e.bullets) ? e.bullets.join(" ") : ""}`)
    .join(" ");
  const educationText = (parsedData.education || [])
    .map((edu: any) => `${edu.institution || ""} ${edu.degree || ""} ${edu.field || ""}`)
    .join(" ");
  const contactText = `${parsedData.name || ""} ${parsedData.email || ""} ${parsedData.phone || ""} ${Array.isArray(parsedData.links) ? parsedData.links.join(" ") : ""}`;

  const rawText = [contactText, summaryText, skillsText, projectsText, experienceText, educationText].join("\n");

  const dummyResume = {
    rawText,
    parsedData
  };

  const localScore = await scoreResumeForRole(dummyResume, targetRole || "Full Stack Developer");
  const jobDescriptionCoverage = jobDescription ? await scoreResumeAgainstJobDescription(dummyResume, jobDescription) : null;

  res.json({
    success: true,
    data: {
      ...localScore,
      jobDescriptionCoverage
    }
  });
}));
router.post("/upload", resumeUpload.single("resume"), asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await uploadResume(req.user!.id, req.file!, req.body.isBaseResume !== "false", { anonymizePreview: req.body.anonymizePreview === "true" }) })));
router.get("/versions", asyncHandler(async (req, res) => res.json({ success: true, data: await listResumeVersions(req.user!.id) })));
router.get("/versions/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await getResumeVersion(req.user!.id, param(req.params.id)) })));
router.get("/", asyncHandler(async (req, res) => res.json({ success: true, data: await listResumes(req.user!.id) })));
router.get("/:id", asyncHandler(async (req, res) => res.json({ success: true, data: await getResume(req.user!.id, param(req.params.id)) })));
router.patch("/:id/parsed-data", asyncHandler(async (req, res) => res.json({ success: true, data: await updateResumeParsedData(req.user!.id, param(req.params.id), req.body.parsedData || req.body) })));
router.post("/:id/analyze", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await analyzeResume(req.user!.id, param(req.params.id), { targetRole: req.body.targetRole, jobDescription: req.body.jobDescription, anonymizeForAnalysis: Boolean(req.body.anonymizeForAnalysis) }) })));
router.post("/:id/improve", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await improveResume(req.user!.id, param(req.params.id), req.body.targetRole) })));
router.post("/:id/export-pdf", asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await exportResumePdf(req.user!.id, param(req.params.id)) })));
export default router;
