import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Calendar, CheckCircle2, Info, Lock, Shield, UserRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Recruiter Portal | AI Job Copilot",
  description: "AI Job Copilot recruiter portal roadmap. Learn about our privacy-first candidate model, future employer tools, and how to express interest in recruiter access.",
  openGraph: {
    title: "Recruiter Portal | AI Job Copilot",
    description: "Privacy-first recruiter tools — coming to AI Job Copilot.",
    type: "website"
  }
};

const ROADMAP = [
  { phase: "A", title: "Recruiter interest collection", status: "In progress", description: "Allow companies to register interest and receive updates. No candidate data shared at this stage." },
  { phase: "B", title: "Verified company profile", status: "Planned", description: "Company email domain verification and LinkedIn company page verification before any recruiter tools are activated." },
  { phase: "C", title: "Job import and quality checks", status: "Planned", description: "Recruiters can post or import job requirements. Each posting passes an automated scam-safety quality check." },
  { phase: "D", title: "Consent-based candidate sharing", status: "Planned", description: "Candidates can opt-in to sharing anonymized match signals with verified employers. No PII shared without explicit consent." },
  { phase: "E", title: "Interview scheduling integration", status: "Provider-ready", description: "Calendar-integrated interview scheduling between candidate and verified recruiter. Requires calendar provider setup." },
  { phase: "F", title: "Employer analytics", status: "Future", description: "Pipeline analytics for verified employers: application rates, match quality, time-to-offer. Aggregate data only, no individual candidate profiling." }
];

const FEATURE_CARDS = [
  { icon: Building2, title: "Job posting / import", status: "Roadmap", description: "Post job requirements directly or import from ATS. Each posting checked for scam signals and quality." },
  { icon: UserRound, title: "Candidate match insights", status: "Roadmap", description: "Consent-gated match signals only. No resume browsing. No contact details without candidate opt-in." },
  { icon: Calendar, title: "Interview scheduling", status: "Provider-ready", description: "Integrated interview requests and calendar invites. Requires Google Calendar or similar provider." },
  { icon: BadgeCheck, title: "Company verification", status: "Roadmap", description: "Email domain verification and LinkedIn company page check before recruiter access is granted." },
  { icon: Shield, title: "Scam-safe verification", status: "Roadmap", description: "Recruiters must verify company identity. No payment-based jobs. Suspicious activity flagged." },
  { icon: CheckCircle2, title: "Candidate feedback loop", status: "Roadmap", description: "Candidates receive feedback after each recruiter interaction. Recruiter rating system planned." }
];

const STATUS_COLORS: Record<string, string> = {
  "In progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "Planned": "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  "Provider-ready": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  "Future": "bg-muted text-muted-foreground",
  "Roadmap": "bg-muted text-muted-foreground"
};

export default function RecruitersPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b bg-gradient-to-br from-primary/5 to-background px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-3xl">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Recruiter Portal</span>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Recruiter Portal Readiness</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            AI Job Copilot is building privacy-first employer tools. Candidate data remains private. Recruiters can only access candidate signals with explicit user consent.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#request-access" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Request recruiter access <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/privacy" className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold hover:bg-muted">
              View candidate privacy policy
            </Link>
          </div>

          {/* Honest status notice */}
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <p><strong>Beta status:</strong> Recruiter portal tools are roadmap/planned only. No active recruiter marketplace exists. No candidate database is exposed to employers.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">

        {/* Privacy first */}
        <section className="mb-14 rounded-xl border bg-card p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold">Privacy and trust — always first</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Candidate data is private — recruiters cannot browse private resumes.",
              "No candidate database is exposed to employers at any stage.",
              "Recruiters can only see anonymized match signals, and only if the candidate explicitly opts in.",
              "No selling, renting, or licensing personal candidate data.",
              "No fake recruiter marketplace — all recruiter accounts must be verified.",
              "Users control what they share and can revoke consent at any time.",
              "No auto-apply — candidates always review before any application is submitted.",
              "Suspicious recruiter activity is flagged and reported."
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recruiter feature cards */}
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-bold">Planned recruiter features</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-lg border bg-card p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 className="text-sm font-bold">{card.title}</h3>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[card.status] || ""}`}>{card.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-bold">Recruiter portal roadmap</h2>
          <div className="space-y-3">
            {ROADMAP.map((item) => (
              <div key={item.phase} className="flex flex-col gap-2 rounded-lg border bg-card p-4 md:flex-row md:items-start md:gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.phase}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold">{item.title}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[item.status] || ""}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Request access form */}
        <section id="request-access" className="mb-14 scroll-mt-8 rounded-xl border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-bold">Request recruiter access</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Recruiter access requests are not live yet. Leave your details and we will contact you when the recruiter portal launches.
          </p>
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            <Info className="mr-1 inline h-3.5 w-3.5" />
            This form does not create an active recruiter account. It registers your interest only. No candidate data will be shared.
          </div>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="company-name" className="mb-1 block text-sm font-medium">Company name</label>
                <input id="company-name" type="text" placeholder="Acme Corp" aria-label="Company name" className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label htmlFor="work-email" className="mb-1 block text-sm font-medium">Work email</label>
                <input id="work-email" type="email" placeholder="hr@company.com" aria-label="Work email" className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label htmlFor="recruiter-role" className="mb-1 block text-sm font-medium">Your role</label>
                <input id="recruiter-role" type="text" placeholder="e.g. HR Manager, Talent Acquisition" aria-label="Your role" className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label htmlFor="hiring-needs" className="mb-1 block text-sm font-medium">Primary hiring need</label>
                <input id="hiring-needs" type="text" placeholder="e.g. Backend engineers, 5-10 hires/month" aria-label="Primary hiring need" className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label htmlFor="recruiter-message" className="mb-1 block text-sm font-medium">Message (optional)</label>
              <textarea id="recruiter-message" placeholder="Tell us about your hiring process or specific requirements..." aria-label="Message" className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button
              type="submit"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-primary/60 px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              aria-disabled="true"
            >
              Submit interest — not live yet
            </button>
            <p className="text-xs text-muted-foreground">Submission is disabled in beta. Contact support via GitHub to express interest.</p>
          </form>
        </section>

        {/* Candidate safety */}
        <section className="mb-14 rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/20">
          <h2 className="mb-4 text-lg font-bold">Candidate safety commitments</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: "Verified recruiter badge", status: "Planned" },
              { label: "Company email verification", status: "Planned" },
              { label: "Warning against payment-based jobs", status: "Live" },
              { label: "Report suspicious recruiter option", status: "Provider-ready" },
              { label: "Scam score for job postings", status: "Live" },
              { label: "No data sharing without consent", status: "Live" }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-white/60 px-3 py-2 text-sm dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[item.status] || ""}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">Are you a job seeker? The candidate tools are live now.</p>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Start your job search for free <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

      </div>
    </main>
  );
}
