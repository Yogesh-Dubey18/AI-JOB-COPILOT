import Link from "next/link";
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, FileText, Layers, MessageSquare, Sparkles, Wrench } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Upload & analyze your resume",
    description: "Upload your resume PDF. The AI parser extracts your skills, work history, and education. Run the ATS analyzer to get a baseline score and identify what is missing for your target role.",
    icon: FileText,
    cta: "Go to Resume",
    href: "/resume/upload",
    tips: ["Use PDF for best parsing accuracy.", "Enable anonymize mode if you are concerned about privacy.", "Note your baseline ATS score before editing."]
  },
  {
    step: "02",
    title: "Discover matching jobs",
    description: "Browse the daily job feed filtered by role, remote type, salary, and trust score. Save roles that match your target criteria before applying.",
    icon: BriefcaseBusiness,
    cta: "Browse Jobs",
    href: "/jobs",
    tips: ["Filter by remote type if you prefer work-from-home roles.", "Use trust score 80+ to avoid risky postings.", "Save at least 5 interesting roles before moving on."]
  },
  {
    step: "03",
    title: "Generate your application kit",
    description: "Select a saved job and a resume version. The AI generates a tailored cover letter, HR email, LinkedIn message, WhatsApp message, referral note, salary negotiation answer, and interview talking points — all for your review.",
    icon: Sparkles,
    cta: "Open Apply Assistant",
    href: "/apply-assistant",
    tips: ["Always review and personalise AI-generated content.", "Use the LinkedIn message when connecting with hiring managers.", "Save the salary answer before your negotiation call."]
  },
  {
    step: "04",
    title: "Track every application",
    description: "Add each application to the tracker as soon as you apply. Move cards through Saved → Applied → HR Round → Technical → Offer → Selected or Rejected. Set follow-up reminders.",
    icon: Layers,
    cta: "Open Tracker",
    href: "/applications",
    tips: ["Log the application date and source for every role.", "Set a follow-up reminder 5-7 days after applying.", "Track rejections too — pattern analysis helps you improve."]
  },
  {
    step: "05",
    title: "Prepare for interviews",
    description: "For every scheduled interview, log the round type, date, mode, and expected topics. Use the mock interview tool for practice answers and scoring.",
    icon: MessageSquare,
    cta: "Interview Prep",
    href: "/interviews",
    tips: ["Practice behavioral questions (STAR method) for HR rounds.", "Run the mock interview at least twice before the actual call.", "Log feedback and result after each round."]
  },
  {
    step: "06",
    title: "Identify and close skill gaps",
    description: "Run the skill gap analyzer for your target role. Get a 7-day or 30-day learning roadmap with specific resources to fill missing skills.",
    icon: Wrench,
    cta: "Skill Gap Analysis",
    href: "/skill-gap",
    tips: ["Focus on the top 3 missing skills from your ATS analysis.", "Build a small project demonstrating each new skill.", "Add completed courses to your resume and re-run the ATS analyzer."]
  },
  {
    step: "07",
    title: "Ask your career mentor",
    description: "Use the AI career mentor for guidance at any step — résumé feedback, motivation, HR email rewrites, negotiation advice, rejection analysis, or next-step prioritisation.",
    icon: Bot,
    cta: "Open Mentor Chat",
    href: "/career-mentor-chat",
    tips: ["Paste the job description when asking for resume tips.", "Ask for a rejection reason analysis after any declined application.", "Request a 7-day job-search plan when you feel stuck."]
  }
];

export default function GuidedWorkflowPage() {
  return (
    <AppShell>
      <PageHeading
        title="Guided job-search workflow"
        description="A step-by-step path from resume upload to offer acceptance. Follow each stage for a structured, data-driven search."
      />
      <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p>All AI-generated content (cover letters, emails, interview answers) must be reviewed and edited by you before use. This tool assists — it does not apply or respond on your behalf.</p>
        </div>
      </div>
      <div className="space-y-6">
        {steps.map(({ step, title, description, icon: Icon, cta, href, tips }) => (
          <Card key={step}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-primary">Step {step}</span>
                    <h2 className="font-bold">{title}</h2>
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
