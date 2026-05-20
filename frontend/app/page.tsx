import Link from "next/link";
import { ArrowRight, Bot, BriefcaseBusiness, FileText, LineChart, MessageSquare, ShieldCheck, type LucideIcon } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { tagline } from "@/lib/constants";

const features: Array<[string, LucideIcon, string]> = [
  ["AI Resume Analyzer", FileText, "ATS score, section feedback, recruiter view, and honest improvement steps."],
  ["Daily Job Matching", BriefcaseBusiness, "Curated fresher, remote, internship, and entry-level roles with fit scoring."],
  ["Apply Assistant", MessageSquare, "Cover letters, HR email, LinkedIn, WhatsApp, referral, and salary answers."],
  ["Interview Copilot", Bot, "Round-wise prep, mock answers, scoring, and next-question practice."],
  ["Analytics", LineChart, "Track applications, response rate, interviews, offers, and missing skills."],
  ["Scam Detector", ShieldCheck, "Spot suspicious offers, payment demands, fake HR emails, and risky job posts."]
];

export default function LandingPage() {
  return (
    <div>
      <PublicNav />
      <section className="product-scene min-h-[84vh] text-white">
        <div className="mx-auto flex min-h-[84vh] max-w-7xl flex-col justify-center px-4 py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-amber-200">Personal AI career assistant for job seekers</p>
            <h1 className="text-4xl font-black tracking-normal md:text-6xl">{tagline}</h1>
            <p className="mt-5 max-w-2xl text-base text-white/88 md:text-lg">Built for freshers, MERN learners, Java developers, interns, remote job seekers, and early-career engineers who want a guided path until selection.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/register"><Button className="bg-white text-slate-950 hover:bg-white/90">Upload resume <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/features"><Button variant="outline" className="border-white/50 text-white hover:bg-white/10">Explore features</Button></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-bold md:text-3xl">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {["Upload resume", "Analyze fit", "Tailor application", "Track until selected"].map((step, index) => (
            <Card key={step}><CardContent className="p-5"><span className="text-sm font-bold text-primary">0{index + 1}</span><p className="mt-3 font-semibold">{step}</p></CardContent></Card>
          ))}
        </div>
      </section>
      <section className="bg-muted/60 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold md:text-3xl">Everything in one job-search cockpit</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, Icon, text]) => (
              <Card key={String(title)}><CardContent className="p-5"><Icon className="h-6 w-6 text-primary" /><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></CardContent></Card>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 lg:grid-cols-5">
        {["Resume AI", "Job matching", "Application tracker", "Interview preparation", "Portfolio generator"].map((item) => (
          <Card key={item}><CardContent className="p-5"><h3 className="font-bold">{item}</h3><p className="mt-2 text-sm text-muted-foreground">Designed around review-first AI outputs and official job links.</p></CardContent></Card>
        ))}
      </section>
      <section className="bg-card py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold md:text-3xl">Pricing preview</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Free", "Pro", "Premium"].map((plan) => <Card key={plan}><CardContent className="p-5"><h3 className="text-xl font-bold">{plan}</h3><p className="mt-2 text-sm text-muted-foreground">Start simple and upgrade when you need deeper AI support.</p></CardContent></Card>)}
          </div>
        </div>
      </section>
      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">AI Job Copilot • Job seeker first • No auto-apply without review</footer>
    </div>
  );
}
