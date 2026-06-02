import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../utils/asyncHandler.js";
import { scoreResumeForRole } from "../services/ats-scoring.service.js";
import { isTest } from "../config/env.js";

const router = Router();

const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  limit: 5, // limit each IP to 5 requests per window
  message: { success: false, error: "Rate limit exceeded. Live demo is limited to 5 checks per hour." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest
});

router.post("/ats", demoLimiter, asyncHandler(async (req, res) => {
  const { resumeText, targetRole } = req.body;
  if (!resumeText || !targetRole) {
    return res.status(400).json({ success: false, error: "resumeText and targetRole are required" });
  }

  const dummyResume = {
    rawText: resumeText,
    parsedData: {
      summary: resumeText.substring(0, 300),
      skills: [],
      projects: [],
      experience: [],
      education: [],
      links: []
    }
  };

  const scoreResult = await scoreResumeForRole(dummyResume, targetRole);

  res.json({
    success: true,
    data: {
      atsScore: scoreResult.atsScore,
      resumeLevel: scoreResult.resumeLevel,
      categoryScores: scoreResult.categoryScores,
      scoreExplanation: scoreResult.scoreExplanation,
      strengths: scoreResult.strengths,
      weaknesses: scoreResult.weaknesses,
      missingKeywords: scoreResult.missingKeywords,
      improvementSuggestions: scoreResult.improvementSuggestions,
      recruiterView: scoreResult.recruiterView
    }
  });
}));

export default router;
