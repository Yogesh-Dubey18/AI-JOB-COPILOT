import { callJsonModel } from "./aiClient.js";
import { createRecord } from "../utils/repository.js";
import { buildresumeAnalysisPrompt } from "./prompts/resumeAnalysis.prompt.js";
import { buildjobMatchPrompt } from "./prompts/jobMatch.prompt.js";
import { buildtailorResumePrompt } from "./prompts/tailorResume.prompt.js";
import { buildapplicationKitPrompt } from "./prompts/applicationKit.prompt.js";
import { buildinterviewPrepPrompt } from "./prompts/interviewPrep.prompt.js";
import { buildmockInterviewPrompt } from "./prompts/mockInterview.prompt.js";
import { buildskillGapPrompt } from "./prompts/skillGap.prompt.js";
import { buildscamDetectorPrompt } from "./prompts/scamDetector.prompt.js";
import { buildcareerChatPrompt } from "./prompts/careerChat.prompt.js";
import { buildrejectionAnalysisPrompt } from "./prompts/rejectionAnalysis.prompt.js";
import { buildportfolioGeneratorPrompt } from "./prompts/portfolioGenerator.prompt.js";
import { buildlinkedinOptimizerPrompt } from "./prompts/linkedinOptimizer.prompt.js";
import { buildfollowUpPrompt } from "./prompts/followUp.prompt.js";

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

async function track(userId: string | undefined, feature: string, status = "success", error = "") {
  await createRecord("aiRequests", {
    userId,
    feature,
    model: "mock-or-configured-ai",
    inputTokens: 0,
    outputTokens: 0,
    status,
    error
  });
}

async function run(userId: string | undefined, feature: string, prompt: string, fallback: any) {
  try {
    const data = await callJsonModel(prompt, fallback);
    await track(userId, feature);
    return data;
  } catch (error) {
    await track(userId, feature, "fallback", error instanceof Error ? error.message : "Unknown AI error");
    return fallback;
  }
}

export const aiService = {
  analyzeResume: (userId: string | undefined, context: any) => run(userId, "resume-analysis", buildresumeAnalysisPrompt(context), resumeAnalysisFallback),
  matchJob: (userId: string | undefined, context: any) => run(userId, "job-match", buildjobMatchPrompt(context), jobMatchFallback),
  tailorResume: (userId: string | undefined, context: any) => run(userId, "tailor-resume", buildtailorResumePrompt(context), tailoredResumeFallback),
  generateApplicationKit: (userId: string | undefined, context: any) => run(userId, "application-kit", buildapplicationKitPrompt(context), applicationKitFallback),
  coverLetter: (userId: string | undefined, context: any) => run(userId, "cover-letter", buildapplicationKitPrompt(context), { coverLetter: applicationKitFallback.coverLetter }),
  interviewPrep: (userId: string | undefined, context: any) => run(userId, "interview-prep", buildinterviewPrepPrompt(context), interviewPrepFallback),
  mockInterview: (userId: string | undefined, context: any) => run(userId, "mock-interview", buildmockInterviewPrompt(context), mockInterviewFallback),
  skillGap: (userId: string | undefined, context: any) => run(userId, "skill-gap", buildskillGapPrompt(context), skillGapFallback),
  scamCheck: (userId: string | undefined, context: any) => run(userId, "scam-check", buildscamDetectorPrompt(context), scamFallback),
  chat: (userId: string | undefined, context: any) => run(userId, "career-chat", buildcareerChatPrompt(context), { answer: "Based on your profile, focus on tailored applications, one strong resume version per role, and interview practice around your projects.", suggestedActions: ["Analyze resume", "Match jobs", "Practice interview"] }),
  rejectionAnalysis: (userId: string | undefined, context: any) => run(userId, "rejection-analysis", buildrejectionAnalysisPrompt(context), rejectionFallback),
  portfolioGenerator: (userId: string | undefined, context: any) => run(userId, "portfolio-generator", buildportfolioGeneratorPrompt(context), { hero: "Full-stack developer building practical web products", about: "I build responsive, API-driven applications with React, Node.js, Express, and MongoDB.", skills: ["React", "Node.js", "MongoDB"], projects: ["AI Job Copilot", "Airbnb clone", "Spotify clone"] }),
  linkedinOptimizer: (userId: string | undefined, context: any) => run(userId, "linkedin-optimizer", buildlinkedinOptimizerPrompt(context), { headline: "Full-stack Developer | React | Node.js | MongoDB", about: "Project-focused developer seeking entry-level software roles." }),
  followUpMessage: (userId: string | undefined, context: any) => run(userId, "follow-up-message", buildfollowUpPrompt(context), { message: "Hi, I wanted to politely follow up on my application. I remain interested in the role and would be happy to share any additional details." })
};
