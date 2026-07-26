import { z } from "zod";

export const resumeAnalysisOutputSchema = z.object({
  atsScore: z.number(),
  letterGrade: z.string().optional(),
  gradeLabel: z.string().optional(),
  scoreBreakdown: z.record(z.number()).optional(),
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
  beforeAtsScore: z.number().default(68),
  afterAtsScore: z.number().default(91),
  addedKeywords: z.array(z.string()).default([]),
  genuineGaps: z.array(z.string()).default([]),
  keywordStuffingWarnings: z.array(z.string()).default([]),
  updatedSummary: z.string().default(""),
  updatedSkills: z.array(z.string()).default([]),
  improvedProjects: z.array(z.string()).default([]),
  changedSections: z.array(z.string()).default([]),
  sectionOrdering: z.array(z.string()).default([]),
  pageLimit: z.number().default(1),
  pdfUrl: z.string().default("")
});

const worldClassSkillSchema = z.object({
  frontend: z.array(z.string()).default([]),
  backend: z.array(z.string()).default([]),
  database: z.array(z.string()).default([]),
  cloud: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  programming: z.array(z.string()).default([]),
  other: z.array(z.string()).default([])
});

export const worldClassResumeOutputSchema = z.object({
  name: z.string().default(""),
  title: z.string().default("Full Stack Developer | MERN Stack"),
  contact: z.object({
    email: z.string().default(""),
    phone: z.string().default(""),
    github: z.string().default(""),
    linkedin: z.string().default(""),
    portfolio: z.string().default(""),
    location: z.string().default("")
  }).default({ email: "", phone: "", github: "", linkedin: "", portfolio: "", location: "" }),
  summary: z.string().default(""),
  skills: worldClassSkillSchema.default({
    frontend: [],
    backend: [],
    database: [],
    cloud: [],
    tools: [],
    programming: [],
    other: []
  }),
  projects: z.array(z.object({
    name: z.string().default(""),
    tech: z.string().default(""),
    description: z.string().default(""),
    bullets: z.array(z.string()).default([]),
    live: z.string().default(""),
    github: z.string().default("")
  })).default([]),
  experience: z.array(z.object({
    title: z.string().default(""),
    company: z.string().default(""),
    duration: z.string().default(""),
    location: z.string().default(""),
    bullets: z.array(z.string()).default([])
  })).default([]),
  education: z.array(z.object({
    degree: z.string().default(""),
    college: z.string().default(""),
    year: z.string().default(""),
    cgpa: z.string().default(""),
    board: z.string().default("")
  })).default([]),
  certifications: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  formattingNotes: z.array(z.string()).default([]),
  atsScore: z.number().default(92),
  atsKeywords: z.array(z.string()).default([])
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
  whyCompanyAnswer: z.string(),
  noticePeriodAnswer: z.string(),
  workAuthorizationAnswer: z.string(),
  assignmentSubmissionAnswer: z.string(),
  followUpMessageAnswer: z.string(),
  rejectionResponseAnswer: z.string(),
  interviewConfirmationAnswer: z.string(),
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

export const interviewCoachOutputSchema = z.object({
  readinessScore: z.number(),
  focusAreas: z.array(z.string()),
  practicePlan: z.array(z.string()),
  projectQuestions: z.array(z.string()),
  hrQuestions: z.array(z.string()),
  dsaQuestions: z.array(z.string())
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
