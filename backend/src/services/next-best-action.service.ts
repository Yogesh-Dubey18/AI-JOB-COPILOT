/**
 * Next-Best-Action Engine — Phase 9: Multi-Agent Career Orchestration
 *
 * This is a deterministic rule-based engine (no AI required).
 * It queries the user's real data counts and returns prioritized action recommendations.
 * If AI is configured, these can be augmented. Deterministic fallback is always available.
 *
 * SAFETY: No autonomous submissions. All recommended actions require user initiation.
 */

type AgentStatus = "complete" | "in_progress" | "pending" | "blocked";

type AgentCard = {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  progress?: number; // 0-100
  metric?: string;   // e.g., "3 resumes uploaded"
  action?: { label: string; href: string };
  blocked?: { reason: string; requirement: string };
  priority: number;  // lower = higher priority (1 = most urgent)
};

type NextBestAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  urgency: "critical" | "high" | "medium" | "low";
  category: string;
};

type NextBestActionEngineResult = {
  agentCards: AgentCard[];
  nextBestActions: NextBestAction[];
  overallProgress: number;        // 0-100
  completedStages: number;
  totalStages: number;
  workflowSummary: string;
};

/**
 * Compute agent cards and next-best-actions from user's real data counts.
 * All params are simple counts from DB queries; no raw data passed to this function.
 */
export function computeNextBestActions(params: {
  resumeCount: number;
  hasBaseResume: boolean;
  applicationCount: number;
  savedCount: number;
  appliedCount: number;
  interviewCount: number;
  offerCount: number;
  answerVaultCount: number;
  profileSkillsCount: number;
  profileRolesCount: number;
  companyResearchCount: number;
  portfolioPublished: boolean;
  kitsGenerated: number;
  followUpsDue: number;
  hasEmail: boolean;
}): NextBestActionEngineResult {
  const {
    resumeCount,
    hasBaseResume,
    applicationCount,
    savedCount,
    appliedCount,
    interviewCount,
    offerCount,
    answerVaultCount,
    profileSkillsCount,
    profileRolesCount,
    companyResearchCount,
    portfolioPublished,
    kitsGenerated,
    followUpsDue,
    hasEmail
  } = params;

  // ---------- Agent Cards ----------
  const agentCards: AgentCard[] = [
    {
      id: "profile-agent",
      name: "Profile Agent",
      description: "Sets up your target roles, skills, and experience level for job matching.",
      status: profileSkillsCount > 0 && profileRolesCount > 0 ? "complete"
        : profileSkillsCount > 0 || profileRolesCount > 0 ? "in_progress"
        : "pending",
      metric: profileSkillsCount > 0 ? `${profileSkillsCount} skills, ${profileRolesCount} target roles` : undefined,
      action: { label: "Set up profile", href: "/profile" },
      priority: profileSkillsCount === 0 ? 1 : 6
    },
    {
      id: "resume-agent",
      name: "Resume Agent",
      description: "Uploads and parses your base resume for ATS analysis and tailoring.",
      status: hasBaseResume ? "complete" : resumeCount > 0 ? "in_progress" : "pending",
      metric: resumeCount > 0 ? `${resumeCount} resume${resumeCount > 1 ? "s" : ""} uploaded` : undefined,
      action: { label: "Upload resume", href: "/resume/upload" },
      priority: resumeCount === 0 ? 2 : 7
    },
    {
      id: "ats-agent",
      name: "ATS Analyzer Agent",
      description: "Scores your resume across 5 categories and provides improvement suggestions.",
      status: hasBaseResume ? "pending" : "blocked",
      blocked: !hasBaseResume ? { reason: "No base resume uploaded yet.", requirement: "Upload a base resume first." } : undefined,
      action: hasBaseResume ? { label: "Analyze resume", href: "/resume/analyzer" } : undefined,
      priority: hasBaseResume ? 3 : 10
    },
    {
      id: "job-agent",
      name: "Job Discovery Agent",
      description: "Finds and filters job listings from the daily feed that match your profile.",
      status: savedCount >= 3 ? "complete" : savedCount > 0 ? "in_progress" : "pending",
      metric: savedCount > 0 ? `${savedCount} jobs saved, ${appliedCount} applied` : undefined,
      action: { label: "Browse jobs", href: "/jobs" },
      priority: savedCount === 0 ? 4 : 8
    },
    {
      id: "apply-agent",
      name: "Application Kit Agent",
      description: "Generates cover letters, HR email drafts, and tailored resume versions for each role.",
      status: kitsGenerated >= 2 ? "complete" : kitsGenerated > 0 ? "in_progress" : "pending",
      blocked: applicationCount === 0 ? { reason: "No saved applications yet.", requirement: "Save at least one job first." } : undefined,
      metric: kitsGenerated > 0 ? `${kitsGenerated} kit${kitsGenerated > 1 ? "s" : ""} generated` : undefined,
      action: applicationCount > 0 ? { label: "Generate application kit", href: "/application-kit" } : undefined,
      priority: applicationCount > 0 && kitsGenerated === 0 ? 5 : 9
    },
    {
      id: "crm-agent",
      name: "CRM Tracker Agent",
      description: "Tracks application stages, follow-up reminders, and interview history.",
      status: appliedCount >= 3 ? "complete" : appliedCount > 0 ? "in_progress" : "pending",
      metric: appliedCount > 0 ? `${appliedCount} active application${appliedCount > 1 ? "s" : ""}${followUpsDue > 0 ? `, ${followUpsDue} follow-up${followUpsDue > 1 ? "s" : ""} due` : ""}` : undefined,
      action: { label: "View applications", href: "/applications" },
      priority: followUpsDue > 0 ? 2 : 10
    },
    {
      id: "interview-agent",
      name: "Interview Prep Agent",
      description: "Runs mock interviews, scores answers, and provides feedback for your target role.",
      status: interviewCount >= 2 ? "complete" : interviewCount > 0 ? "in_progress" : "pending",
      metric: interviewCount > 0 ? `${interviewCount} session${interviewCount > 1 ? "s" : ""} completed` : undefined,
      action: { label: "Start mock interview", href: "/interviews" },
      priority: appliedCount > 0 && interviewCount === 0 ? 4 : 11
    },
    {
      id: "answer-agent",
      name: "Answer Vault Agent",
      description: "Stores and generates AI-powered answers to common HR, salary, and behavioral questions.",
      status: answerVaultCount >= 5 ? "complete" : answerVaultCount > 0 ? "in_progress" : "pending",
      metric: answerVaultCount > 0 ? `${answerVaultCount} answer${answerVaultCount > 1 ? "s" : ""} saved` : undefined,
      action: { label: "Open answer vault", href: "/answer-vault" },
      priority: interviewCount > 0 && answerVaultCount === 0 ? 3 : 12
    },
    {
      id: "portfolio-agent",
      name: "Portfolio Agent",
      description: "Generates a public portfolio site with your projects, skills, and contact info.",
      status: portfolioPublished ? "complete" : "pending",
      metric: portfolioPublished ? "Portfolio published" : undefined,
      action: { label: "Build portfolio", href: "/portfolio-generator" },
      priority: resumeCount > 0 && !portfolioPublished ? 6 : 13
    },
    {
      id: "research-agent",
      name: "Company Research Agent",
      description: "Researches target companies, culture, glassdoor signals, and recent news.",
      status: companyResearchCount >= 3 ? "complete" : companyResearchCount > 0 ? "in_progress" : "pending",
      metric: companyResearchCount > 0 ? `${companyResearchCount} companies researched` : undefined,
      action: { label: "Research companies", href: "/company-research" },
      priority: appliedCount > 0 && companyResearchCount === 0 ? 5 : 14
    }
  ];

  // Sort by priority
  agentCards.sort((a, b) => a.priority - b.priority);

  // ---------- Next-Best-Actions (ordered by urgency) ----------
  const nextBestActions: NextBestAction[] = [];

  if (followUpsDue > 0) {
    nextBestActions.push({
      id: "followup-due",
      title: `${followUpsDue} follow-up${followUpsDue > 1 ? "s" : ""} overdue`,
      description: `You have ${followUpsDue} applications where follow-up is due or overdue. Reach out to recruiters.`,
      href: "/applications?filter=followup",
      urgency: "critical",
      category: "CRM"
    });
  }
  if (offerCount > 0) {
    nextBestActions.push({
      id: "offer-pending",
      title: `${offerCount} offer${offerCount > 1 ? "s" : ""} to review`,
      description: "You have pending offers. Use the salary counter template in Answer Vault for negotiation.",
      href: "/applications?status=Offer",
      urgency: "critical",
      category: "Offer"
    });
  }
  if (resumeCount === 0) {
    nextBestActions.push({
      id: "upload-resume",
      title: "Upload your first resume",
      description: "The entire workflow starts with your resume. Upload a PDF to get your ATS score and start job matching.",
      href: "/resume/upload",
      urgency: "high",
      category: "Resume"
    });
  }
  if (resumeCount > 0 && savedCount === 0) {
    nextBestActions.push({
      id: "save-jobs",
      title: "Save 3 jobs to start tracking",
      description: "Browse the daily feed and save at least 3 roles that match your target role before generating application kits.",
      href: "/jobs",
      urgency: "high",
      category: "Jobs"
    });
  }
  if (savedCount >= 1 && kitsGenerated === 0) {
    nextBestActions.push({
      id: "generate-kit",
      title: "Generate your first application kit",
      description: "Create a tailored cover letter and resume version for a saved job. Review everything before applying.",
      href: "/application-kit",
      urgency: "high",
      category: "Apply"
    });
  }
  if (appliedCount > 0 && interviewCount === 0) {
    nextBestActions.push({
      id: "prep-interview",
      title: "Prepare for interviews",
      description: "You have active applications. Start a mock interview session to prepare for technical and HR rounds.",
      href: "/interviews",
      urgency: "medium",
      category: "Interview"
    });
  }
  if (appliedCount > 0 && companyResearchCount === 0) {
    nextBestActions.push({
      id: "research-companies",
      title: "Research companies you applied to",
      description: "Company research helps you answer 'why our company?' confidently and negotiate better.",
      href: "/company-research",
      urgency: "medium",
      category: "Research"
    });
  }
  if (profileSkillsCount === 0) {
    nextBestActions.push({
      id: "complete-profile",
      title: "Complete your profile",
      description: "Add your skills and target roles to improve job matching accuracy.",
      href: "/profile",
      urgency: "medium",
      category: "Profile"
    });
  }
  if (!portfolioPublished && resumeCount > 0) {
    nextBestActions.push({
      id: "publish-portfolio",
      title: "Publish your portfolio",
      description: "A public portfolio link in your applications increases recruiter response rates.",
      href: "/portfolio-generator",
      urgency: "low",
      category: "Portfolio"
    });
  }
  if (answerVaultCount === 0) {
    nextBestActions.push({
      id: "answer-vault",
      title: "Set up your Answer Vault",
      description: "Prepare STAR-format answers for tell me about yourself, salary, and notice period before interviews.",
      href: "/answer-vault",
      urgency: "low",
      category: "Interview Prep"
    });
  }
  if (!hasEmail) {
    nextBestActions.push({
      id: "verify-email",
      title: "Verify your email for notifications",
      description: "Email is needed for interview reminders and follow-up alerts when the email provider is configured.",
      href: "/settings",
      urgency: "low",
      category: "Account"
    });
  }

  // ---------- Overall Progress ----------
  const completedStages = agentCards.filter((a) => a.status === "complete").length;
  const totalStages = agentCards.length;
  const overallProgress = Math.round((completedStages / totalStages) * 100);

  const workflowSummary = overallProgress >= 80
    ? "You are in the final stages of your job search workflow. Focus on follow-ups and offer evaluation."
    : overallProgress >= 50
    ? "You are in the application phase. Keep applying, tracking, and preparing for interviews."
    : overallProgress >= 25
    ? "You have set up your foundation. Start discovering jobs and generating application kits."
    : "You are just getting started. Upload your resume and set up your profile first.";

  return {
    agentCards,
    nextBestActions: nextBestActions.slice(0, 8), // Top 8 actions
    overallProgress,
    completedStages,
    totalStages,
    workflowSummary
  };
}
