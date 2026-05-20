import { z } from "zod";

export const resumeAnalysisOutputSchema = z.object({
  atsScore: z.number(),
  resumeLevel: z.string(),
  sectionScores: z.record(z.number()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
  recruiterView: z.string()
});

export const jobMatchOutputSchema = z.object({
  matchScore: z.number(),
  selectionChance: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  experienceFit: z.string(),
  salaryFit: z.string(),
  locationFit: z.string(),
  recommendationReason: z.string(),
  applyRecommendation: z.string(),
  riskFlags: z.array(z.string())
});
