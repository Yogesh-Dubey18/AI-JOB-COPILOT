"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, Circle, FileText, Layers, MessageSquare, Sparkles, Wrench, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function GuidedWorkflowPage() {
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => api.get<any[]>("/resumes"), retry: false });
  const applications = useQuery({ queryKey: ["applications"], queryFn: () => api.get<any[]>("/applications"), retry: false });
  const interviews = useQuery({ queryKey: ["interviews"], queryFn: () => api.get<any[]>("/interviews"), retry: false });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => api.get<any>("/profile"), retry: false });
  const answerVault = useQuery({ queryKey: ["answer-vault"], queryFn: () => api.get<any[]>("/answer-vault"), retry: false });

  const resumesCount = resumes.data?.length ?? 0;
  const appsCount = applications.data?.length ?? 0;
  const trackedAppsCount = (applications.data || []).filter((a: any) => a.status !== "Saved").length;
  const kitsCount = (applications.data || []).filter((a: any) => a.applicationKitId || a.resumeVersionId).length;
  const interviewsCount = interviews.data?.length ?? 0;
  const profileSkillsCount = profile.data?.skills?.length ?? 0;
  const profileRolesCount = profile.data?.targetRoles?.length ?? 0;
  const answersCount = answerVault.data?.length ?? 0;

  const isStep1Done = resumesCount > 0;
  const isStep2Done = appsCount > 0;
  const isStep3Done = kitsCount > 0;
  const isStep4Done = trackedAppsCount > 0;
  const isStep5Done = interviewsCount > 0;
  const isStep6Done = profileSkillsCount > 0 || profileRolesCount > 0;
  const isStep7Done = answersCount > 0;

  const steps = [
    {
      step: "01",
      title: "Upload & analyze your resume",
      description: "Upload your resume PDF. The AI parser extracts your skills, work history, and education. Run the ATS analyzer to get a baseline score and identify what is missing for your target role.",
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
      href: "/skill-gap",
      tips: ["Focus on the top 3 missing skills from your ATS analysis.", "Build a small project demonstrating each new skill.", "Add completed courses to your resume and re-run the ATS analyzer."],
      isDone: isStep6Done,
      statusLabel: isStep6Done ? "Completed (profile skills configured)" : "Pending"
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
            <span className="text-primary">{doneStepsCount} of 7 steps completed ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p>All AI-generated content (cover letters, emails, interview answers) must be reviewed and edited by you before use. This tool assists — it does not apply or respond on your behalf.</p>
          </div>
        </CardContent>
      </Card>

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
