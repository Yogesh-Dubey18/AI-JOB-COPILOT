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

export const tailoredResumeOutputSchema = z.object({
  beforeAtsScore: z.number(),
  afterAtsScore: z.number(),
  addedKeywords: z.array(z.string()),
  updatedSummary: z.string(),
  updatedSkills: z.array(z.string()),
  improvedProjects: z.array(z.string()),
  changedSections: z.array(z.string()),
  pdfUrl: z.string()
});

export const applicationKitOutputSchema = z.object({
  coverLetter: z.string(),
  hrEmail: z.string(),
  linkedinMessage: z.string(),
  whatsappMessage: z.string(),
  referralMessage: z.string(),
  salaryAnswer: z.string(),
  whyHireYouAnswer: z.string(),
  tellMeAboutYourselfAnswer: z.string(),
  interviewPrepPlan: z.array(z.string())
});

export const interviewPrepOutputSchema = z.object({
  technicalTopics: z.array(z.string()),
  technicalQuestions: z.array(z.string()),
  hrQuestions: z.array(z.string()),
  projectQuestions: z.array(z.string()),
  codingQuestions: z.array(z.string()),
  systemDesignQuestions: z.array(z.string()),
  companyResearch: z.array(z.string()),
  finalPreparationPlan: z.array(z.string())
});

export const mockInterviewOutputSchema = z.object({
  score: z.object({
    confidence: z.number(),
    technicalAccuracy: z.number(),
    communication: z.number(),
    completeness: z.number(),
    projectClarity: z.number().optional()
  }),
  feedback: z.string(),
  improvedAnswer: z.string(),
  nextQuestion: z.string()
});

export const skillGapOutputSchema = z.object({
  targetRole: z.string(),
  missingSkills: z.array(z.string()),
  prioritySkills: z.array(z.string()),
  sevenDayPlan: z.array(z.string()),
  thirtyDayPlan: z.array(z.string()),
  projectSuggestions: z.array(z.string())
});

export const scamDetectorOutputSchema = z.object({
  trustScore: z.number(),
  riskLevel: z.string(),
  redFlags: z.array(z.string()),
  recommendation: z.string()
});

export const rejectionAnalysisOutputSchema = z.object({
  likelyReason: z.string(),
  improvementPlan: z.array(z.string()),
  resumeChanges: z.array(z.string()),
  interviewTopics: z.array(z.string()),
  nextActions: z.array(z.string())
});

export const looseObjectOutputSchema = z.record(z.any());
