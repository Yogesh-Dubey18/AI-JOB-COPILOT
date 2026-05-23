import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    title: "AI Resume Analyzer",
    text: "ATS score, missing keywords, recruiter view, section scores, and improvement suggestions.",
    href: "/resume/analyzer"
  },
  {
    title: "AI Job Discovery",
    text: "Daily feed, filters by remote type, experience, salary, and trust score for fresher-friendly roles.",
    href: "/jobs"
  },
  {
    title: "AI Resume Builder",
    text: "Role templates, live preview, version history, and PDF-ready output.",
    href: "/resume/builder"
  },
  {
    title: "AI Apply Assistant",
    text: "Cover letter, HR email, LinkedIn, WhatsApp, referral, salary answers \u2014 all user-reviewed.",
    href: "/apply-assistant"
  },
  {
    title: "Application Tracker",
    text: "Kanban pipeline from saved to selected or rejected with follow-up reminders.",
    href: "/applications"
  },
  {
    title: "Interview Preparation",
    text: "Round-wise prep, mock interview scores, and improved answer suggestions.",
    href: "/interviews"
  },
  {
    title: "Skill Gap Roadmap",
    text: "Seven-day and thirty-day learning plans with resources based on your target role.",
    href: "/skill-gap"
  },
  {
    title: "Portfolio Generator",
    text: "Recruiter-friendly profile, projects, case studies, and a shareable public slug.",
    href: "/portfolio-generator"
  },
  {
    title: "Job Scam Detector",
    text: "Trust score and red flag analysis before you invest time in an application.",
    href: "/job-scam-detector"
  },
  {
    title: "Career Mentor Chat",
    text: "Context-aware AI guidance across resume, jobs, interviews, and skill building.",
    href: "/career-mentor-chat"
  },
  {
    title: "Recruiter Contacts",
    text: "Track hiring managers, recruiters, and referrals with notes and follow-up status.",
    href: "/contacts"
  },
  {
    title: "Guided Workflow",
    text: "Step-by-step path from resume upload to offer acceptance with actionable tips.",
    href: "/guided-workflow"
  }
];

export default function FeaturesPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">Features</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          A complete AI workflow for resume improvement, job matching, applications, interviews, skills, portfolio, and safety checks.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div>
                  <h2 className="font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </div>
                <div className="mt-4">
                  <Link href={item.href}>
                    <Button variant="outline">
                      Try it <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
