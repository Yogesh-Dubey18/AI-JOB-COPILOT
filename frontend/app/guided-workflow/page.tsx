"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, Circle, FileText, Layers,
  MessageSquare, Sparkles, Wrench, CheckCircle, AlertTriangle, Zap, Trophy
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

const urgencyColors: Record<string, string> = {
  critical: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200",
  high: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
  medium: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200",
  low: "border-muted bg-muted/40 text-muted-foreground"
};

const statusColors: Record<string, string> = {
  complete: "border-emerald-200 dark:border-emerald-900",
  in_progress: "border-blue-200 dark:border-blue-800",
  pending: "",
  blocked: "opacity-60"
};

export default function GuidedWorkflowPage() {
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => api.get<any[]>("/resumes"), retry: false });
  const applications = useQuery({ queryKey: ["applications"], queryFn: () => api.get<any[]>("/applications"), retry: false });
  const interviews = useQuery({ queryKey: ["interviews"], queryFn: () => api.get<any[]>("/interviews"), retry: false });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => api.get<any>("/profile"), retry: false });
  const answerVault = useQuery({ queryKey: ["answer-vault"], queryFn: () => api.get<any[]>("/answer-vault"), retry: false });
  const learningPlans = useQuery({ queryKey: ["learning-plans"], queryFn: () => api.get<any[]>("/ai/skill-gap/plans"), retry: false });
  const nextBestActions = useQuery({
    queryKey: ["next-best-actions"],
    queryFn: () => api.get<any>("/workflow/next-best-actions"),
    retry: false
  });

  const resumesCount = resumes.data?.length ?? 0;
  const appsCount = applications.data?.length ?? 0;
  const trackedAppsCount = (applications.data || []).filter((a: any) => a.status !== "Saved").length;
  const kitsCount = (applications.data || []).filter((a: any) => a.applicationKitId || a.resumeVersionId).length;
  const interviewsCount = interviews.data?.length ?? 0;
  const profileSkillsCount = profile.data?.skills?.length ?? 0;
  const profileRolesCount = profile.data?.targetRoles?.length ?? 0;
  const answersCount = answerVault.data?.length ?? 0;

  // Interview prep status (deterministic heuristic)
  const hasSalaryAnswer = (answerVault.data || []).some((v: any) => /salary|compensation|ctc|pay/i.test(v.question));
  const hasProjectAnswer = (answerVault.data || []).some((v: any) => /project|built|created|developed/i.test(v.question));
  const interviewPrepStatus =
    interviewsCount > 0 || (answersCount >= 3 && hasSalaryAnswer && hasProjectAnswer)
      ? "Ready for mock interview"
      : answersCount >= 3
      ? "Answers saved"
      : answersCount > 0
      ? "Questions prepared"
      : "Not started";
  const interviewPrepDone = interviewPrepStatus === "Ready for mock interview";

  const isStep1Done = resumesCount > 0;
  const isStep2Done = appsCount > 0;
  const isStep3Done = kitsCount > 0;
  const isStep4Done = trackedAppsCount > 0;
  const isStep5Done = interviewsCount > 0;
  const plans = learningPlans.data || [];
  const latestPlan = plans[0];
  let skillRoadmapStatus = "Not started";
  let isStep6Done = false;
  if (latestPlan) {
    isStep6Done = true;
    if (latestPlan.progress > 0) {
      skillRoadmapStatus = "Practice started";
    } else if (latestPlan.sevenDayPlan?.length || latestPlan.thirtyDayPlan?.length) {
      skillRoadmapStatus = "Roadmap generated";
    } else if (latestPlan.missingSkills?.length) {
      skillRoadmapStatus = "Gaps identified";
    }
  }
  const isStep7Done = answersCount > 0;

  const steps = [
    {
      step: "01",
      title: "Upload & analyze your resume",
      description: "Upload your resume PDF. The AI parser extracts your skills, work history, and education. Run the ATS analyzer to get a 5-category baseline score and identify what is missing for your target role.",
      icon: FileText,
      cta: "Go to Resume",
      href: "/resume/upload",
      tips: ["Use PDF for best parsing accuracy.", "Enable anonymize mode if you are concerned about privacy.", "Note your baseline ATS score before editing."],
      isDone: isStep1Done,
      statusLabel: isStep1Done ? `Completed (${resumesCount} resume${resumesCount > 1 ? "s" : ""})` : "Pending"
    },
    {
      step: "02",
      title: "Discover matching jobs",
      description: "Browse the daily job feed filtered by role, remote type, salary, and trust score. Save roles that match your target criteria before applying.",
      icon: BriefcaseBusiness,
      cta: "Browse Jobs",
      href: "/jobs",
      tips: ["Filter by remote type if you prefer work-from-home roles.", "Use trust score 80+ to avoid risky postings.", "Save at least 5 interesting roles before moving on."],
      isDone: isStep2Done,
      statusLabel: isStep2Done ? `Completed (${appsCount} saved role${appsCount > 1 ? "s" : ""})` : "Pending"
    },
    {
      step: "03",
      title: "Generate your application kit",
      description: "Select a saved job and a resume version. The AI generates a tailored cover letter, HR email, LinkedIn message, WhatsApp message, referral note, salary negotiation answer, and interview talking points — all for your review.",
      icon: Sparkles,
      cta: "Open Apply Assistant",
      href: "/apply-assistant",
      tips: ["Always review and personalise AI-generated content.", "Use the LinkedIn message when connecting with hiring managers.", "Save the salary answer before your negotiation call."],
      isDone: isStep3Done,
      statusLabel: isStep3Done ? `Completed (${kitsCount} tailored kit${kitsCount > 1 ? "s" : ""})` : "Pending"
    },
    {
      step: "04",
      title: "Track every application",
      description: "Add each application to the tracker as soon as you apply. Move cards through Saved → Applied → HR Round → Technical → Offer → Selected or Rejected. Set follow-up reminders.",
      icon: Layers,
      cta: "Open Tracker",
      href: "/applications",
      tips: ["Log the application date and source for every role.", "Set a follow-up reminder 5-7 days after applying.", "Track rejections too — pattern analysis helps you improve."],
      isDone: isStep4Done,
      statusLabel: isStep4Done ? `Completed (${trackedAppsCount} active application${trackedAppsCount > 1 ? "s" : ""})` : "Pending"
    },
    {
      step: "05",
      title: "Prepare for interviews",
      description: "For every scheduled interview, log the round type, date, mode, and expected topics. Use the mock interview tool for practice answers and scoring.",
      icon: MessageSquare,
      cta: "Interview Prep",
      href: "/interviews",
      tips: ["Practice behavioral questions (STAR method) for HR rounds.", "Run the mock interview at least twice before the actual call.", "Log feedback and result after each round."],
      isDone: isStep5Done,
      statusLabel: isStep5Done ? `Completed (${interviewsCount} interview${interviewsCount > 1 ? "s" : ""})` : "Pending"
    },
    {
      step: "06",
      title: "Identify and close skill gaps",
      description: "Run the skill gap analyzer for your target role. Get a 7-day or 30-day learning roadmap with specific resources to fill missing skills.",
      icon: Wrench,
      cta: "Skill Gap Analysis",
      href: "/skill-roadmap",
      tips: ["Focus on the top 3 missing skills from your ATS analysis.", "Build a small project demonstrating each new skill.", "Add completed courses to your resume and re-run the ATS analyzer."],
      isDone: isStep6Done,
      statusLabel: isStep6Done ? skillRoadmapStatus : "Not started"
    },
    {
      step: "07",
      title: "Ask your career mentor",
      description: "Use the AI career mentor for guidance at any step — résumé feedback, motivation, HR email rewrites, negotiation advice, rejection analysis, or next-step prioritisation.",
      icon: Bot,
      cta: "Open Mentor Chat",
      href: "/career-mentor-chat",
      tips: ["Paste the job description when asking for resume tips.", "Ask for a rejection reason analysis after any declined application.", "Request a 7-day job-search plan when you feel stuck."],
      isDone: isStep7Done,
      statusLabel: isStep7Done ? `Completed (${answersCount} saved answer${answersCount > 1 ? "s" : ""})` : "Pending"
    }
  ];

  const doneStepsCount = [isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done, isStep6Done, isStep7Done].filter(Boolean).length;
  const progressPercent = Math.round((doneStepsCount / 7) * 100);

  // Agent cards and NBA from API (Phase 9)
  const nba = nextBestActions.data;
  const agentCards: any[] = nba?.agentCards || [];
  const nbaList: any[] = nba?.nextBestActions || [];
  const overallProgress = nba?.overallProgress ?? progressPercent;
  const workflowSummary = nba?.workflowSummary;

  return (
    <AppShell>
      <PageHeading
        title="Guided job-search workflow"
        description="A step-by-step path from resume upload to offer acceptance. Follow each stage for a structured, data-driven search."
      />

      {/* Progress banner */}
      <Card className="mb-6 border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/10">
        <CardContent className="p-5 space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-emerald-800 dark:text-emerald-200">Overall Progress</span>
            <span className="text-primary">{nba ? `${nba.completedStages} of ${nba.totalStages} agents complete` : `${doneStepsCount} of 7 steps completed`} ({overallProgress}%)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
          </div>
          {workflowSummary && (
            <p className="text-xs text-muted-foreground">{workflowSummary}</p>
          )}
          <div className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p>All AI-generated content (cover letters, emails, interview answers) must be reviewed and edited by you before use. This tool assists — it does not apply or respond on your behalf.</p>
          </div>
        </CardContent>
      </Card>

      {/* Next-Best-Actions Panel (Phase 9) */}
      {nbaList.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Recommended next actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nbaList.slice(0, 6).map((action: any) => (
              <Link key={action.id} href={action.href}>
                <div className={`rounded-md border p-3 text-sm hover:opacity-80 transition-opacity cursor-pointer ${urgencyColors[action.urgency]}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{action.title}</p>
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border">
                      {action.urgency}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-80">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Agent Cards (Phase 9) */}
      {agentCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Agent status overview
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agentCards.map((card: any) => (
              <div key={card.id} className={`rounded-md border p-3 text-sm ${statusColors[card.status]}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-xs">{card.name}</p>
                  {card.status === "complete" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  {card.status === "in_progress" && <Circle className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                  {card.status === "pending" && <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  {card.status === "blocked" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                </div>
                {card.metric && <p className="text-xs text-muted-foreground">{card.metric}</p>}
                {card.blocked && <p className="text-xs text-amber-700 dark:text-amber-400">{card.blocked.reason}</p>}
                {card.action && card.status !== "blocked" && (
                  <Link href={card.action.href}>
                    <button className="mt-2 text-xs text-primary underline-offset-2 hover:underline">
                      {card.action.label} →
                    </button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Prep Status Card */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Interview Preparation Status
        </h2>
        <div className={`rounded-md border p-4 ${interviewPrepDone ? "border-emerald-200 bg-emerald-50/10 dark:border-emerald-800" : "border-muted"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">{interviewPrepStatus}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {interviewPrepDone
                  ? "You have prepared answers and logged interviews. Run a mock interview to finalize."
                  : interviewPrepStatus === "Answers saved"
                  ? "Great start! Add a salary expectation and project explanation answer to advance."
                  : interviewPrepStatus === "Questions prepared"
                  ? "Save at least 3 prepared answers to the Answer Vault."
                  : "Open Advanced Interview Prep to start building your STAR answers."}
              </p>
            </div>
            <Link href="/interviews/prep">
              <Button variant={interviewPrepDone ? "outline" : "primary"}>
                {interviewPrepDone ? "View Prep" : "Start Prep"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Traditional Step-by-Step Workflow */}
      <div className="space-y-6">
        {steps.map(({ step, title, description, icon: Icon, cta, href, tips, isDone, statusLabel }) => (
          <Card key={step} className={isDone ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/5 dark:bg-emerald-950/5" : ""}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">Step {step}</span>
                      <h2 className="font-bold">{title}</h2>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                      isDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <ul className="space-y-1">
                    {tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <Link href={href}>
                    <Button>
                      {cta} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
