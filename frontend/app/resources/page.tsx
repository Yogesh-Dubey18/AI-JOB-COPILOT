import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, FileText, Lightbulb, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Career Resource Hub | AI Job Copilot",
  description: "Free guides on ATS resumes, interview prep, salary negotiation, job scam alerts, LinkedIn optimization, and full-stack developer roadmaps. Powered by AI Job Copilot.",
  keywords: ["resume tips", "ATS resume guide", "interview preparation", "salary negotiation", "job scam alerts", "full stack developer roadmap", "React interview questions", "Node.js interview questions", "MERN stack", "fresher job guide"],
  openGraph: {
    title: "Career Resource Hub | AI Job Copilot",
    description: "Free career guides to help you land your next job smarter.",
    type: "website"
  }
};

const FEATURED_GUIDES = [
  {
    id: "ats-resume",
    title: "ATS-Friendly Resume Guide",
    description: "Learn how applicant tracking systems work and how to format your resume to pass automated screening and land more interviews.",
    level: "Essential",
    icon: FileText,
    link: "/resume/analyzer",
    linkLabel: "Analyze your resume",
    color: "border-violet-300 bg-violet-50 dark:bg-violet-950/20"
  },
  {
    id: "fullstack-roadmap",
    title: "Full Stack Developer Roadmap",
    description: "Step-by-step guide for 2024–2025: HTML/CSS → JavaScript → React → Node.js → Express → MongoDB → REST APIs → Docker → Cloud → Open source.",
    level: "Intermediate",
    icon: BookOpen,
    link: "/skill-gap",
    linkLabel: "Check your skill gaps",
    color: "border-blue-300 bg-blue-50 dark:bg-blue-950/20"
  },
  {
    id: "interview-prep",
    title: "Interview Preparation Guide",
    description: "Covers HR, behavioral (STAR method), technical rounds, system design basics, and salary negotiation for engineering and non-engineering roles.",
    level: "Essential",
    icon: Lightbulb,
    link: "/interviews",
    linkLabel: "Track your interviews",
    color: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
  },
  {
    id: "scam-safety",
    title: "Job Scam Safety Guide",
    description: "Identify fake job offers: too-good salary, advance fee requests, vague JDs, unverified recruiters, and phishing attempts. Always verify before applying.",
    level: "Safety",
    icon: ShieldAlert,
    link: "/job-scam-detector",
    linkLabel: "Use scam detector",
    color: "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
  }
];

const RESOURCE_CATEGORIES = [
  {
    category: "Resume",
    resources: [
      { title: "Resume Tips for Freshers", description: "How to structure your resume with no experience, emphasising projects, internships, and skills.", difficulty: "Beginner", link: "/resume/upload", linkLabel: "Upload resume" },
      { title: "ATS Optimisation Checklist", description: "Keywords, section order, formatting rules, and common ATS red flags to avoid.", difficulty: "Intermediate", link: "/resume/analyzer", linkLabel: "Run ATS check" },
      { title: "Quantifying Achievements", description: "How to turn vague bullet points into impact statements: numbers, percentages, business outcomes.", difficulty: "Intermediate", link: "/career-vault", linkLabel: "Career vault" }
    ]
  },
  {
    category: "Interview Prep",
    resources: [
      { title: "STAR Method Guide", description: "How to answer behavioral questions with Situation, Task, Action, Result. Includes 10 example answers.", difficulty: "Essential", link: "/answer-vault", linkLabel: "Build answer vault" },
      { title: "React Interview Questions", description: "Top 50 React questions: hooks, state management, lifecycle, performance, and real-world scenarios.", difficulty: "Intermediate", link: "/interviews", linkLabel: "Track interviews" },
      { title: "Node.js Interview Questions", description: "Event loop, async/await, streams, cluster, Express middleware, authentication, and REST design.", difficulty: "Intermediate", link: "/interviews", linkLabel: "Track interviews" },
      { title: "MERN Stack Interview Questions", description: "Full-stack questions covering MongoDB, Express, React, and Node.js with architectural scenarios.", difficulty: "Advanced", link: "/interviews", linkLabel: "Mock interview" }
    ]
  },
  {
    category: "Job Search",
    resources: [
      { title: "Fresher Job Application Guide", description: "Step-by-step: build skills → create resume → apply to 5+ jobs/day → follow up → track → iterate.", difficulty: "Beginner", link: "/guided-workflow", linkLabel: "Use workflow" },
      { title: "Job Application Follow-up Templates", description: "Email and LinkedIn message templates for following up after applying, after interviews, and after rejection.", difficulty: "Essential", link: "/apply-assistant", linkLabel: "Generate application kit" },
      { title: "Job Scam Alerts", description: "Red flags in job postings: fake companies, advance fee scams, data harvesting JDs, and unverified recruiters.", difficulty: "Safety", link: "/job-scam-detector", linkLabel: "Detect scams" }
    ]
  },
  {
    category: "LinkedIn & Networking",
    resources: [
      { title: "LinkedIn Profile Optimisation", description: "Headline formula, About section structure, featured projects, skills endorsements, and connection strategies.", difficulty: "Essential", link: "/linkedin-optimizer", linkLabel: "Optimize LinkedIn" },
      { title: "LinkedIn Recruiter Message Templates", description: "Copy-ready templates for reaching out to recruiters, hiring managers, and referral contacts.", difficulty: "Essential", link: "/contacts", linkLabel: "Add contacts" }
    ]
  },
  {
    category: "Salary",
    resources: [
      { title: "Salary Negotiation Guide", description: "How to research market range, time your salary discussion, handle low offers, and negotiate without risking the offer.", difficulty: "Essential", link: "/company-research", linkLabel: "Research company salaries" }
    ]
  }
];

const TEMPLATE_BLOCKS = [
  {
    title: "HR follow-up email (5 days after applying)",
    content: `Subject: Follow-up: [Role] Application — [Your Name]

Hi [Recruiter Name],

I applied for the [Role] position at [Company] on [Date] and wanted to follow up to confirm my application was received.

I am very interested in this opportunity and believe my experience in [Skill/Domain] makes me a strong fit. Please let me know if you need any additional information.

Thank you for your time.

Best regards,
[Your Name]`
  },
  {
    title: "LinkedIn recruiter outreach",
    content: `Hi [Name],

I noticed your team is hiring for [Role] at [Company]. I have [X] years of experience in [Skill] and have worked on [Brief Example].

I would love to connect and learn more about the opportunity. Happy to share my resume.

Best,
[Your Name]`
  },
  {
    title: "Salary expectation answer",
    content: `Based on my research on market standards for this role in [Location], and my [X] years of experience in [Skill], I am targeting ₹X–Y LPA. I am open to discussing the full compensation package including variable pay and benefits.`
  },
  {
    title: "Tell me about yourself answer",
    content: `I am a [role/domain] professional with [X] years of experience in [Key Skills]. I have worked at [Company/Project] where I [Brief Achievement]. I am currently looking for a role that lets me [Goal]. I am excited about [Company] because [Specific Reason].`
  }
];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  Advanced: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  Essential: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  Safety: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
};

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b bg-gradient-to-br from-primary/5 to-background px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-3xl">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Free Career Resources</span>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Career Resource Hub</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Free guides on ATS resumes, interview prep, salary negotiation, job scam alerts, LinkedIn optimization, and developer roadmaps — curated for the Indian job market.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/resume/analyzer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Upload your resume and start your AI job workflow <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/guided-workflow"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold hover:bg-muted"
            >
              Guided workflow
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            AI output should be reviewed before applying. All AI features are provider-ready — see <Link href="/settings/integrations" className="underline">integration status</Link>.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">

        {/* Featured Guides */}
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-bold">Featured guides</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURED_GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <div key={guide.id} className={`rounded-xl border p-5 ${guide.color}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${LEVEL_COLORS[guide.level] || ""}`}>{guide.level}</span>
                  </div>
                  <h3 className="mb-2 text-base font-bold">{guide.title}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">{guide.description}</p>
                  <Link href={guide.link} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    {guide.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Resource Categories */}
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-bold">All resource categories</h2>
          {RESOURCE_CATEGORIES.map((cat) => (
            <div key={cat.category} className="mb-8">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{cat.category}</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {cat.resources.map((res) => (
                  <div key={res.title} className="rounded-lg border bg-card p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${LEVEL_COLORS[res.difficulty] || ""}`}>{res.difficulty}</span>
                    </div>
                    <h4 className="mb-1 text-sm font-bold">{res.title}</h4>
                    <p className="mb-3 text-xs text-muted-foreground">{res.description}</p>
                    <Link href={res.link} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      {res.linkLabel} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Templates Section */}
        <section className="mb-14">
          <h2 className="mb-2 text-xl font-bold">Ready-to-use templates</h2>
          <p className="mb-6 text-sm text-muted-foreground">Copy and personalise before use. Replace text in [brackets] with real information.</p>
          <div className="space-y-4">
            {TEMPLATE_BLOCKS.map((block) => (
              <div key={block.title} className="rounded-lg border bg-card">
                <div className="border-b px-4 py-2">
                  <p className="text-sm font-semibold">{block.title}</p>
                </div>
                <pre className="whitespace-pre-wrap px-4 py-3 text-xs text-muted-foreground">{block.content}</pre>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            For AI-generated personalised versions, use the <Link href="/apply-assistant" className="underline">Apply Assistant</Link> or <Link href="/career-mentor-chat" className="underline">Career Mentor</Link>.
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-xl border bg-primary/5 px-6 py-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="mb-2 text-xl font-bold">Ready to put this into action?</h2>
          <p className="mb-6 text-sm text-muted-foreground">Upload your resume, analyze your ATS score, find matching jobs, and generate your complete application kit — all in one workflow.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/resume/analyzer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Start with resume analyzer <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/jobs" className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold hover:bg-muted">
              Browse matching jobs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
