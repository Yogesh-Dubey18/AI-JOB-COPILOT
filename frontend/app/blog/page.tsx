import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Career Blog | AI Job Copilot",
  description: "Career advice, job search strategies, ATS resume tips, interview prep, salary negotiation guides, and AI job search insights from AI Job Copilot.",
  keywords: ["career blog", "resume tips", "interview prep", "salary negotiation", "AI job search", "ATS resume", "full stack developer", "fresher jobs India"],
  openGraph: {
    title: "Career Blog | AI Job Copilot",
    description: "Job search guides, resume tips, and AI-powered career advice.",
    type: "website"
  }
};

const POSTS = [
  {
    slug: "ats-friendly-resume-guide-2025",
    title: "How to Write an ATS-Friendly Resume in 2025",
    summary: "Most resumes never reach a human recruiter. Learn how ATS systems work, which formats they reject, and how to optimise your resume for automated screening.",
    category: "Resume",
    readTime: "7 min",
    tags: ["ats", "resume", "job search"],
    link: "/resources"
  },
  {
    slug: "star-method-behavioral-interview",
    title: "The STAR Method: A Practical Guide to Behavioral Interviews",
    summary: "Situation, Task, Action, Result — how to structure your answers for HR and behavioral rounds with 10 worked examples for engineering and non-technical roles.",
    category: "Interview",
    readTime: "9 min",
    tags: ["interview", "star method", "hr round"],
    link: "/resources"
  },
  {
    slug: "salary-negotiation-for-freshers",
    title: "Salary Negotiation for Freshers: What to Say and When",
    summary: "When recruiters ask 'what is your expected CTC', most freshers freeze. This guide covers research methods, timing, phrasing, and handling low offers.",
    category: "Salary",
    readTime: "6 min",
    tags: ["salary", "negotiation", "fresher"],
    link: "/company-research"
  },
  {
    slug: "full-stack-developer-roadmap-2025",
    title: "Full Stack Developer Roadmap 2025 — From Zero to Hireable",
    summary: "A realistic, prioritized learning path for full stack development: HTML/CSS → JavaScript → React → Node.js → Express → MongoDB → Deployment → Open Source.",
    category: "Roadmap",
    readTime: "12 min",
    tags: ["full stack", "roadmap", "mern", "web development"],
    link: "/skill-gap"
  },
  {
    slug: "job-scam-red-flags",
    title: "Job Scam Red Flags Every Job Seeker Must Know",
    summary: "Fake companies, advance fee requests, data harvesting JDs, too-good-to-be-true salaries — how to spot and avoid job scams on LinkedIn, Naukri, and WhatsApp.",
    category: "Safety",
    readTime: "5 min",
    tags: ["scam", "safety", "fake jobs"],
    link: "/job-scam-detector"
  },
  {
    slug: "linkedin-profile-optimization",
    title: "LinkedIn Profile Optimisation for Developers in 2025",
    summary: "Headline formula, About section structure, featured projects, skills endorsements, and how to attract recruiter messages without applying to hundreds of jobs.",
    category: "LinkedIn",
    readTime: "8 min",
    tags: ["linkedin", "networking", "personal branding"],
    link: "/linkedin-optimizer"
  },
  {
    slug: "react-interview-questions-2025",
    title: "50 React Interview Questions (With Answers) for 2025",
    summary: "Covers hooks, state management, context, useEffect patterns, performance optimization, lazy loading, testing, and real system design questions.",
    category: "Interview",
    readTime: "15 min",
    tags: ["react", "interview", "frontend"],
    link: "/answer-vault"
  },
  {
    slug: "nodejs-interview-questions",
    title: "Top Node.js Interview Questions for Backend Roles",
    summary: "Event loop, async/await, streams, child processes, cluster, Express middleware, JWT auth, REST best practices, and database connection patterns.",
    category: "Interview",
    readTime: "14 min",
    tags: ["node.js", "backend", "interview"],
    link: "/answer-vault"
  },
  {
    slug: "fresher-job-application-guide",
    title: "Fresher Job Application Guide: A Complete Step-by-Step System",
    summary: "Resume → skill building → job search → applying to 5+ roles/day → follow-up → interview prep → offer negotiation. A complete repeatable workflow.",
    category: "Job Search",
    readTime: "10 min",
    tags: ["fresher", "job application", "strategy"],
    link: "/guided-workflow"
  },
  {
    slug: "ai-job-search-workflow",
    title: "How AI Job Copilot Can Improve Your Job Search Workflow",
    summary: "See how AI-powered resume analysis, ATS scoring, application kit generation, mock interviews, and skill gap analysis work together in one workflow.",
    category: "Product",
    readTime: "5 min",
    tags: ["ai", "job search", "workflow", "copilot"],
    link: "/guided-workflow"
  }
];

const CATEGORY_COLORS: Record<string, string> = {
  Resume: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  Interview: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  Salary: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Roadmap: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  Safety: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  LinkedIn: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "Job Search": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  Product: "bg-primary/10 text-primary"
};

export default function BlogPage() {
  const featured = POSTS[0];
  const rest = POSTS.slice(1);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b bg-gradient-to-br from-primary/5 to-background px-4 py-14 text-center md:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Career Blog</span>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Job search guides and career advice</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Practical guides on ATS resumes, interview prep, salary negotiation, LinkedIn, developer roadmaps, and AI-powered job search — for freshers and experienced professionals in India.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12">

        {/* Featured post */}
        <section className="mb-12">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Featured guide</h2>
          <div className="rounded-xl border bg-card p-6 md:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[featured.category] || ""}`}>{featured.category}</span>
              <span className="text-xs text-muted-foreground">{featured.readTime} read</span>
            </div>
            <h3 className="mb-3 text-xl font-bold md:text-2xl">{featured.title}</h3>
            <p className="mb-4 text-sm text-muted-foreground md:text-base">{featured.summary}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={featured.link} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Read guide <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex flex-wrap gap-1">
                {featured.tags.map((t) => (
                  <span key={t} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">#{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* All posts grid */}
        <section className="mb-12">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">All guides</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {rest.map((post) => (
              <div key={post.slug} className="flex flex-col rounded-lg border bg-card p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] || ""}`}>{post.category}</span>
                  <span className="text-xs text-muted-foreground">{post.readTime} read</span>
                </div>
                <h3 className="mb-2 text-sm font-bold leading-snug">{post.title}</h3>
                <p className="mb-3 flex-1 text-xs text-muted-foreground">{post.summary}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={post.link} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    Read guide <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border bg-primary/5 px-6 py-10 text-center">
          <h2 className="mb-2 text-lg font-bold">Put the guides into practice</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Upload your resume, check your ATS score, find jobs, and generate your complete application kit in one AI-powered workflow.
          </p>
          <p className="mb-5 text-xs text-muted-foreground">
            AI output should be reviewed before applying. See <Link href="/settings/integrations" className="underline">integration status</Link> for provider readiness.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/resume/analyzer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Upload resume and start workflow <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/resources" className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              All resources
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
