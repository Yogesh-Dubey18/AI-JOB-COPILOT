import type { ZodSchema } from "zod";
import { callJsonModelWithMeta, getAiRuntime, type AiCallMeta } from "./aiClient.js";
import { ApiError } from "../utils/ApiError.js";
import { checkAiCreditLimit } from "../services/usage-limit.service.js";
import { getUsageSummary, recordUsageEvent } from "../services/usage.service.js";
import { createRecord } from "../utils/repository.js";
import { buildresumeAnalysisPrompt } from "./prompts/resumeAnalysis.prompt.js";
import { buildjobMatchPrompt } from "./prompts/jobMatch.prompt.js";
import { buildtailorResumePrompt } from "./prompts/tailorResume.prompt.js";
import { buildapplicationKitPrompt } from "./prompts/applicationKit.prompt.js";
import { buildcoverLetterPrompt } from "./prompts/coverLetter.prompt.js";
import { buildinterviewPrepPrompt } from "./prompts/interviewPrep.prompt.js";
import { buildmockInterviewPrompt } from "./prompts/mockInterview.prompt.js";
import { buildinterviewCoachPrompt } from "./prompts/interviewCoach.prompt.js";
import { buildskillGapPrompt } from "./prompts/skillGap.prompt.js";
import { buildscamDetectorPrompt } from "./prompts/scamDetector.prompt.js";
import { buildcareerChatPrompt } from "./prompts/careerChat.prompt.js";
import { buildrejectionAnalysisPrompt } from "./prompts/rejectionAnalysis.prompt.js";
import { buildportfolioGeneratorPrompt } from "./prompts/portfolioGenerator.prompt.js";
import { buildlinkedinOptimizerPrompt } from "./prompts/linkedinOptimizer.prompt.js";
import { buildfollowUpPrompt } from "./prompts/followUp.prompt.js";
import {
  applicationKitOutputSchema,
  interviewCoachOutputSchema,
  interviewPrepOutputSchema,
  jobMatchOutputSchema,
  looseObjectOutputSchema,
  mockInterviewOutputSchema,
  rejectionAnalysisOutputSchema,
  resumeAnalysisOutputSchema,
  scamDetectorOutputSchema,
  skillGapOutputSchema,
  tailoredResumeOutputSchema
} from "./schemas/outputs.js";
import { buildGuardedPrompt, getAiSafetyStatus, type GuardrailResult } from "./guardrails.js";

const resumeAnalysisFallback = {
  atsScore: 82,
  resumeLevel: "Good",
  sectionScores: { summary: 75, skills: 85, projects: 80, experience: 70, education: 90, formatting: 78 },
  strengths: ["Clear technical stack", "Project-led profile", "Readable education section"],
  weaknesses: ["Summary can be sharper", "Some bullets need measurable impact", "Missing deployment keywords"],
  missingKeywords: ["REST APIs", "Authentication", "Testing", "Deployment", "Docker"],
  improvementSuggestions: [
    "Rewrite the summary around target role keywords.",
    "Add outcome-focused project bullets with metrics where truthful.",
    "Group skills by frontend, backend, database, tools, and fundamentals."
  ],
  recruiterView: "Strong fresher or junior MERN profile. Best fit improves when projects show ownership, testing, and deployment details."
};

const jobMatchFallback = {
  matchScore: 88,
  selectionChance: "High",
  matchedSkills: ["React", "Node.js", "MongoDB"],
  missingSkills: ["Docker", "AWS"],
  experienceFit: "Good",
  salaryFit: "Good",
  locationFit: "Good",
  recommendationReason: "Strong MERN stack match with relevant project background.",
  applyRecommendation: "Apply after tailoring resume to the role keywords.",
  riskFlags: []
};

const tailoredResumeFallback = {
  beforeAtsScore: 68,
  afterAtsScore: 91,
  addedKeywords: ["REST API", "JWT authentication", "responsive UI", "MongoDB aggregation"],
  updatedSummary: "Full-stack developer focused on React, Node.js, Express, and MongoDB with hands-on project experience building production-style web apps.",
  updatedSkills: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "REST APIs", "JWT", "Tailwind CSS"],
  improvedProjects: ["Reframed project bullets around API design, authentication, data modeling, and deployment readiness."],
  changedSections: ["summary", "skills", "projects"],
  pdfUrl: ""
};

const applicationKitFallback = {
  coverLetter: "Dear Hiring Team, I am excited to apply for this role because my React, Node.js, Express, and MongoDB project work matches the core requirements. I would value the chance to discuss how I can contribute with clean implementation, fast learning, and ownership.",
  hrEmail: "Subject: Application for the role\n\nHi, I have applied for the position and attached my tailored resume. My recent projects align with the required stack, and I would be grateful for an opportunity to interview.",
  linkedinMessage: "Hi, I noticed the opening and believe my MERN stack projects align well. I have applied and would appreciate your guidance on the next steps.",
  whatsappMessage: "Hi, I applied for the role and wanted to share that my React/Node/MongoDB projects match the requirements. Please let me know if any details are needed.",
  referralMessage: "Hi, I am applying for this role and my project experience aligns with the listed stack. If you feel comfortable, I would be grateful for a referral.",
  salaryAnswer: "I am open to a fair fresher or junior-market offer based on the role scope, learning opportunity, and company standards.",
  whyHireYouAnswer: "You should hire me because I combine hands-on full-stack project work with strong fundamentals, clear communication, and a willingness to learn quickly without overstating my experience.",
  tellMeAboutYourselfAnswer: "I am a full-stack developer focused on React, Node.js, Express, and MongoDB. I have built practical projects with authentication, APIs, dashboards, and responsive UI, and I am now looking for a role where I can contribute and keep growing.",
  interviewPrepPlan: ["Revise project architecture", "Practice JavaScript and React fundamentals", "Prepare API and database explanations", "Practice concise HR answers"]
};

const interviewPrepFallback = {
  technicalTopics: ["JavaScript", "React hooks", "Node.js APIs", "MongoDB schemas", "Authentication"],
  technicalQuestions: ["Explain useEffect dependencies.", "How do you secure a JWT-based API?", "How do you design a MongoDB schema for applications?"],
  hrQuestions: ["Tell me about yourself.", "Why this company?", "Describe a project challenge."],
  projectQuestions: ["What problem did your project solve?", "How did you structure the backend?", "What would you improve?"],
  codingQuestions: ["Two sum", "Debounced search", "Array grouping"],
  systemDesignQuestions: ["Design a job application tracker for freshers."],
  companyResearch: ["Read the product pages", "Understand customer segment", "Prepare two thoughtful questions"],
  finalPreparationPlan: ["Day 1: revise resume", "Day 2: projects", "Day 3: mock interview", "Day 4: company-specific practice"]
};

const mockInterviewFallback = {
  score: { confidence: 8, technicalAccuracy: 7, communication: 9, completeness: 7, projectClarity: 8 },
  feedback: "Good structure. Add one concrete project example and explain tradeoffs more clearly.",
  improvedAnswer: "A stronger answer starts with the result, explains your specific responsibility, then mentions the technical decisions and impact.",
  nextQuestion: "Walk me through the architecture of your strongest full-stack project."
};

const interviewCoachFallback = {
  readinessScore: 72,
  focusAreas: ["Project explanation", "JavaScript fundamentals", "API design", "Concise HR answers"],
  practicePlan: ["Practice one project story using problem-action-result.", "Revise React hooks and Node API basics.", "Solve two easy DSA problems aloud.", "Record one mock HR answer."],
  projectQuestions: ["Why did you build this project?", "What was your exact contribution?", "How would you improve the architecture?"],
  hrQuestions: ["Tell me about yourself.", "Why should we hire you?", "How do you handle feedback?"],
  dsaQuestions: ["Explain two sum.", "Find duplicates in an array.", "Reverse words in a string."]
};

const skillGapFallback = {
  targetRole: "Full Stack Developer",
  missingSkills: ["Docker", "AWS basics", "Testing"],
  prioritySkills: ["TypeScript", "REST API design", "Authentication", "Testing"],
  sevenDayPlan: ["Revise JS fundamentals", "Build one auth API", "Add tests", "Deploy one project", "Practice React hooks", "Mock interview", "Apply to five tailored jobs"],
  thirtyDayPlan: ["Week 1 fundamentals", "Week 2 backend depth", "Week 3 deployment and testing", "Week 4 interview and applications"],
  projectSuggestions: ["Job tracker dashboard", "Role-based auth app", "Portfolio with case studies"]
};

const scamFallback = {
  trustScore: 42,
  riskLevel: "High",
  redFlags: ["Personal email used by recruiter", "Unrealistic salary promise", "Payment or registration fee mentioned"],
  recommendation: "Avoid applying until the company and recruiter identity are verified."
};

const rejectionFallback = {
  likelyReason: "Resume and project examples may not have matched the job keywords closely enough.",
  improvementPlan: ["Tailor resume before applying", "Add missing role keywords truthfully", "Practice project explanation"],
  resumeChanges: ["Tighten summary", "Add measurable project outcomes", "Move strongest skills higher"],
  interviewTopics: ["React fundamentals", "API design", "database modeling"],
  nextActions: ["Improve resume version", "Apply to 5 better-matched roles", "Schedule a mock interview"]
};

async function track(userId: string | undefined, feature: string, meta: AiCallMeta, guardrails: GuardrailResult) {
  await createRecord("aiRequests", {
    userId,
    feature,
    model: `${meta.provider}:${meta.model}`,
    provider: meta.provider,
    inputTokens: meta.inputTokens,
    outputTokens: meta.outputTokens,
    status: meta.status,
    error: meta.error || "",
    latencyMs: meta.latencyMs,
    fallbackUsed: meta.fallbackUsed,
    validationPassed: meta.validationPassed,
    safetyFlags: guardrails.safetyFlags,
    promptChars: guardrails.finalChars,
    privacyMode: "no_raw_prompt_storage"
  });
}

async function run<T>(userId: string | undefined, feature: string, prompt: string, fallback: T, schema?: ZodSchema<T>) {
  if (userId) {
    const limit = await checkAiCreditLimit(userId, feature);
    if (!limit.allowed) throw new ApiError(402, "AI credit limit reached", limit);
  }
  const guardedPrompt = buildGuardedPrompt(feature, prompt);
  const result = await callJsonModelWithMeta(guardedPrompt.prompt, fallback, schema);
  await track(userId, feature, result.meta, guardedPrompt);
  await recordUsageEvent(userId, feature, Math.max(1, Math.ceil((result.meta.inputTokens + result.meta.outputTokens) / 1000)), "ai", {
    provider: result.meta.provider,
    status: result.meta.status,
    fallbackUsed: result.meta.fallbackUsed
  });
  return result.data;
}

export const aiService = {
  status: () => {
    const runtime = getAiRuntime();
    return {
      provider: runtime.provider,
      model: runtime.model,
      timeoutMs: runtime.timeoutMs,
      retryAttempts: runtime.retryAttempts,
      fallbackEnabled: true,
      providerConfigured: runtime.provider !== "mock",
      schemaValidation: "enabled",
      usageTracking: "enabled",
      privacyMode: "no raw prompt or provider secret storage",
      safety: getAiSafetyStatus()
    };
  },
  usage: (userId: string) => getUsageSummary(userId),
  analyzeResume: (userId: string | undefined, context: any) => run(userId, "resume-analysis", buildresumeAnalysisPrompt(context), resumeAnalysisFallback, resumeAnalysisOutputSchema),
  matchJob: (userId: string | undefined, context: any) => run(userId, "job-match", buildjobMatchPrompt(context), jobMatchFallback, jobMatchOutputSchema),
  tailorResume: (userId: string | undefined, context: any) => run(userId, "tailor-resume", buildtailorResumePrompt(context), tailoredResumeFallback, tailoredResumeOutputSchema),
  generateApplicationKit: (userId: string | undefined, context: any) => run(userId, "application-kit", buildapplicationKitPrompt(context), applicationKitFallback, applicationKitOutputSchema),
  coverLetter: (userId: string | undefined, context: any) => run(userId, "cover-letter", buildcoverLetterPrompt(context), { coverLetter: applicationKitFallback.coverLetter }, looseObjectOutputSchema),
  interviewPrep: (userId: string | undefined, context: any) => run(userId, "interview-prep", buildinterviewPrepPrompt(context), interviewPrepFallback, interviewPrepOutputSchema),
  interviewCoach: (userId: string | undefined, context: any) => run(userId, "interview-coach", buildinterviewCoachPrompt(context), interviewCoachFallback, interviewCoachOutputSchema),
  mockInterview: (userId: string | undefined, context: any) => run(userId, "mock-interview", buildmockInterviewPrompt(context), mockInterviewFallback, mockInterviewOutputSchema),
  skillGap: (userId: string | undefined, context: any) => run(userId, "skill-gap", buildskillGapPrompt(context), skillGapFallback, skillGapOutputSchema),
  scamCheck: (userId: string | undefined, context: any) => run(userId, "scam-check", buildscamDetectorPrompt(context), scamFallback, scamDetectorOutputSchema),
  chat: (userId: string | undefined, context: any) => run(userId, "career-chat", buildcareerChatPrompt(context), { answer: "Based on your profile, focus on tailored applications, one strong resume version per role, and interview practice around your projects.", suggestedActions: ["Analyze resume", "Match jobs", "Practice interview"] }, looseObjectOutputSchema),
  rejectionAnalysis: (userId: string | undefined, context: any) => run(userId, "rejection-analysis", buildrejectionAnalysisPrompt(context), rejectionFallback, rejectionAnalysisOutputSchema),
  portfolioGenerator: (userId: string | undefined, context: any) => run(userId, "portfolio-generator", buildportfolioGeneratorPrompt(context), { hero: "Full-stack developer building practical web products", about: "I build responsive, API-driven applications with React, Node.js, Express, and MongoDB.", skills: ["React", "Node.js", "MongoDB"], projects: ["AI Job Copilot", "Airbnb clone", "Spotify clone"] }, looseObjectOutputSchema),
  linkedinOptimizer: (userId: string | undefined, context: any) => run(userId, "linkedin-optimizer", buildlinkedinOptimizerPrompt(context), { headline: "Full-stack Developer | React | Node.js | MongoDB", about: "Project-focused developer seeking entry-level software roles." }, looseObjectOutputSchema),
  followUpMessage: (userId: string | undefined, context: any) => run(userId, "follow-up-message", buildfollowUpPrompt(context), { message: "Hi, I wanted to politely follow up on my application. I remain interested in the role and would be happy to share any additional details." }, looseObjectOutputSchema),
  parseJobText: (userId: string | undefined, context: any) => run(userId, "job-parser", `Extract structured job details from the following raw job description text.
Format the output as a valid JSON object matching this schema:
{
  "title": "Job title or best estimate",
  "company": "Company name",
  "location": "location, e.g. city, Remote, Hybrid",
  "remoteType": "Remote" | "Hybrid" | "Onsite",
  "jobType": "Full-time" | "Internship" | "Contract" | "Part-time",
  "salaryMin": number | null,
  "salaryMax": number | null,
  "skillsRequired": ["skill1", "skill2"],
  "description": "brief summary",
  "responsibilities": ["resp1", "resp2"],
  "requirements": ["req1", "req2"],
  "applyUrl": "url if found"
}

Raw job text:
${context.text}`, context.fallback, looseObjectOutputSchema)
};
