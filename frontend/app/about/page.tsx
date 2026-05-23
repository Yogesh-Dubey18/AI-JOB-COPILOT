import Link from "next/link";
import { ArrowRight, Code2, GitBranch, Globe, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const values = [
  {
    icon: Users,
    title: "Job seeker first",
    text: "Every feature is designed around the candidate journey, not employer workflows. From resume parsing to offer negotiation, the platform keeps your interests central."
  },
  {
    icon: Sparkles,
    title: "Review-based AI",
    text: "All generated content \u2014 cover letters, HR emails, interview answers \u2014 is presented for your review before use. No auto-apply without your explicit confirmation."
  },
  {
    icon: ShieldCheck,
    title: "Privacy by design",
    text: "Optional anonymize mode redacts your name, email, phone, and links before sending data to AI providers. You control what information is shared."
  },
  {
    icon: Code2,
    title: "Open development",
    text: "Built with Next.js, Express, and MongoDB. The codebase is openly documented and each integration is clearly labelled as live or provider-ready."
  },
  {
    icon: Globe,
    title: "India-centric, globally capable",
    text: "Salary data in INR, Naukri and LinkedIn board integration, and fresher-friendly defaults \u2014 while remaining usable for any job market worldwide."
  },
  {
    icon: GitBranch,
    title: "Continuous improvement",
    text: "Analytics, skill gap analysis, and rejection pattern tracking keep improving your search strategy after every result, positive or negative."
  }
];

const timeline = [
  { phase: "Phase 1\u201310", title: "Core foundations", detail: "Auth, resume upload, basic job feed, application tracker." },
  { phase: "Phase 11\u201320", title: "AI features", detail: "ATS analyzer, apply assistant, mock interview, scam detector." },
  { phase: "Phase 21\u201330", title: "Growth features", detail: "Skill roadmap, portfolio generator, analytics dashboard, mentor chat." },
  { phase: "Phase 31\u201340", title: "Production hardening", detail: "Security audit, GDPR controls, rate limiting, error monitoring." },
  { phase: "Phase 41\u201350", title: "v2 stable", detail: "Billing foundation, admin tools, feedback loop, documentation." },
  { phase: "v2 Beta+", title: "Current", detail: "Integration status UI, guided workflow, experience filters, contacts CRM." }
];

export default function AboutPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">About AI Job Copilot</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          A personal AI career operating system for freshers, MERN developers, Java engineers, interns, and anyone navigating a competitive job market. Built to guide you from resume upload all the way to offer acceptance.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent className="p-5">
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="mt-4 font-bold">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">Development timeline</h2>
          <p className="mt-2 text-sm text-muted-foreground">Built in 50+ phases. Each phase delivered a testable, deployable improvement.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {timeline.map(({ phase, title, detail }) => (
              <div key={phase} className="rounded-md border p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">{phase}</p>
                <p className="mt-1 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-md border bg-card p-6">
          <h2 className="text-xl font-bold">Honest disclaimer</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            AI Job Copilot does not guarantee interviews, offers, salary, selection, or employment. All AI-generated content is a starting point \u2014 review, personalise, and own every message before sending it. Third-party job board APIs (LinkedIn, Indeed, Naukri, ZipRecruiter, Dice) require approved credentials and are labelled as provider-ready until configured.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/features"><Button>Explore features <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/contact"><Button variant="outline">Contact us</Button></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
