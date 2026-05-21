import Link from "next/link";
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, FileText, LineChart, MessageSquare, ShieldCheck, type LucideIcon } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { tagline } from "@/lib/constants";
import { plans } from "@/lib/plans";

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
              <Link href="/register"><Button className="bg-white text-slate-950 hover:bg-white/90">Upload resume and see match score <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/features"><Button variant="outline" className="border-white/50 text-white hover:bg-white/10">Explore features</Button></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-primary">Interactive demo preview</p>
            <h2 className="mt-2 text-2xl font-bold">Sample resume analysis</h2>
            <div className="mt-5 rounded-md border bg-muted/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Full Stack Developer resume</p>
                  <p className="text-sm text-muted-foreground">React, Node.js, MongoDB, JWT, deployment</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">82</p>
                  <p className="text-xs text-muted-foreground">ATS score</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {["Strong MERN keyword coverage", "Missing Docker and AWS", "Add quantified project results", "Keep one-page ATS formatting"].map((item) => (
                  <div key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> <span>{item}</span></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-primary">Job matching preview</p>
            <h2 className="mt-2 text-2xl font-bold">Rank jobs before applying</h2>
            <div className="mt-5 space-y-3">
              {[
                ["MERN Stack Developer", "StackNova", "Remote", "88%"],
                ["React Developer", "PixelCraft Labs", "Hybrid", "81%"],
                ["Backend Developer Intern", "ServerSide Co", "Mumbai", "76%"]
              ].map(([role, company, location, score]) => (
                <div key={role} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="font-semibold">{role}</p>
                    <p className="text-sm text-muted-foreground">{company} - {location}</p>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-bold text-primary">{score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
          <h2 className="text-2xl font-bold md:text-3xl">Plans with clear limits</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-normal text-primary">{plan.badge}</p>
                  <h3 className="mt-2 text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-black">INR {plan.price}<span className="text-sm font-medium text-muted-foreground">/month</span></p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> {feature}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">AI Job Copilot - Job seeker first - No auto-apply without review</footer>
    </div>
  );
}
