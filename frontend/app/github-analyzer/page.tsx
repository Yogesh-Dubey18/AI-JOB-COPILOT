"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Archive, CheckCircle2, Copy, Github, Globe, Info, Lightbulb, Sparkles, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const README_CHECKLIST = [
  "Project title is clear and descriptive",
  "One-line summary explains what the project does",
  "Problem statement / motivation is included",
  "Tech stack is listed clearly",
  "Installation instructions are present",
  "Usage examples or screenshots are included",
  "Live demo link is provided",
  "License is specified"
];

const STRUCTURE_CHECKLIST = [
  "Code is organized in logical folders/modules",
  "Consistent naming conventions used",
  "Environment variables are in .env.example",
  "No hardcoded secrets or API keys in code",
  "Tests are present (even basic ones)",
  "Error handling is visible in key areas"
];

const DEPLOYMENT_CHECKLIST = [
  "Project is deployed on a live URL",
  "Build/start scripts are documented",
  "Environment variables are documented",
  "Docker or CI/CD setup exists (optional bonus)",
  "HTTPS is enabled on the live deployment"
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      className="h-7 px-2 text-xs"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      <Copy className="mr-1 h-3.5 w-3.5" />
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

function Checklist({ items, checked = [] }: { items: string[]; checked?: string[] }) {
  const allChecked = checked.length === 0;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => {
        const isChecked = allChecked || checked.includes(item);
        return (
          <li key={i} className="flex items-start gap-2 text-sm">
            {isChecked
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Present" />
              : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-label="Missing" />}
            <span className={isChecked ? "" : "text-muted-foreground"}>{item}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function GitHubAnalyzerPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [techStack, setTechStack] = useState("");
  const [description, setDescription] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [readmeText, setReadmeText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const analyze = useMutation({
    mutationFn: () => api.post<any>("/ai/github-analyzer", {
      repoUrl: repoUrl.trim() || undefined,
      projectTitle: projectTitle.trim(),
      techStack: techStack.split(",").map((s) => s.trim()).filter(Boolean),
      description: description.trim(),
      demoUrl: demoUrl.trim() || undefined,
      readmeText: readmeText.trim() || undefined,
      message: `Analyze GitHub project: ${projectTitle}. Tech: ${techStack}. Description: ${description}`
    })
  });

  const result = analyze.data;

  function copyItem(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <AppShell>
      <PageHeading
        title="GitHub project analyzer"
        description="Turn your GitHub projects into resume bullets, portfolio case studies, and interview talking points. Improve README and deployment readiness."
      />

      {/* Provider-ready notice */}
      <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">GitHub API — provider-ready</p>
            <p className="mt-0.5">Live GitHub repo metadata (stars, contributors, languages) requires a GitHub API token or OAuth. Without it, use the manual input form below. Set <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">GITHUB_TOKEN</code> in your backend <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">.env</code> to activate. Private repositories require user OAuth consent.</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/career-vault"><Button variant="outline"><Archive className="h-4 w-4" /> Career vault</Button></Link>
        <Link href="/portfolio-generator"><Button variant="outline"><Globe className="h-4 w-4" /> Portfolio generator</Button></Link>
        <Link href="/apply-assistant"><Button variant="outline"><Sparkles className="h-4 w-4" /> Application kit</Button></Link>
      </div>

      {/* Analyzer form */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Github className="h-4 w-4" />Analyze a project</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">GitHub repo URL (optional)</label>
              <Input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/username/repo-name" aria-label="GitHub repo URL" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Project title</label>
              <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g. AI Job Copilot" aria-label="Project title" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tech stack (comma-separated)</label>
              <Input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, Node.js, MongoDB, Express" aria-label="Tech stack" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Live demo URL (optional)</label>
              <Input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://your-project.vercel.app" aria-label="Live demo URL" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Short description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this project do? What problem does it solve?" aria-label="Description" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">README or project notes (paste here for better analysis)</label>
              <textarea
                value={readmeText}
                onChange={(e) => setReadmeText(e.target.value)}
                placeholder="Paste your README content or any project notes here..."
                aria-label="README text"
                className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <Button
            className="mt-3"
            disabled={analyze.isPending || !projectTitle.trim()}
            onClick={() => analyze.mutate()}
          >
            <Sparkles className="h-4 w-4" />
            {analyze.isPending ? "Analyzing..." : "Analyze project"}
          </Button>
          {analyze.isError ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {analyze.error instanceof Error ? analyze.error.message : "Could not analyze project. Check if the AI provider is configured."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Self-assessment checklists */}
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">README quality</CardTitle></CardHeader>
          <CardContent><Checklist items={README_CHECKLIST} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Code structure</CardTitle></CardHeader>
          <CardContent><Checklist items={STRUCTURE_CHECKLIST} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Deployment readiness</CardTitle></CardHeader>
          <CardContent><Checklist items={DEPLOYMENT_CHECKLIST} /></CardContent>
        </Card>
      </div>

      {/* AI Results */}
      {result ? (
        <div className="space-y-5">
          {/* Resume bullets */}
          {(result.resumeBullets || result.bullets || []).length ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Resume bullets</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(result.resumeBullets || result.bullets || []).map((bullet: string, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-md bg-muted/60 px-3 py-2">
                    <p className="flex-1 text-sm">• {bullet}</p>
                    <Button variant="ghost" className="h-6 shrink-0 px-2 text-xs" onClick={() => copyItem(bullet, i)}>
                      {copiedIdx === i ? "✓" : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* Portfolio case study */}
          {(result.portfolioCaseStudy || result.caseStudy) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  Portfolio case study
                  <CopyButton text={result.portfolioCaseStudy || result.caseStudy} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap rounded-md bg-muted/60 p-3 text-sm">{result.portfolioCaseStudy || result.caseStudy}</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Interview talking points */}
          {(result.interviewPoints || result.talkingPoints || []).length ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4" />Interview talking points</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(result.interviewPoints || result.talkingPoints || []).map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {/* Improvement suggestions */}
          {(result.improvements || result.suggestions || []).length ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Suggested improvements</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(result.improvements || result.suggestions || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {/* Recruiter / portfolio / interview scores */}
          {(result.scores || result.readiness) ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Readiness scores</CardTitle></CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(result.scores || result.readiness, null, 2)}</pre>
              </CardContent>
            </Card>
          ) : null}

          {/* Raw fallback */}
          {!result.resumeBullets && !result.bullets && !result.portfolioCaseStudy && !result.caseStudy && !result.interviewPoints && !result.talkingPoints ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Analysis result</CardTitle></CardHeader>
              <CardContent><pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(result, null, 2)}</pre></CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link href="/career-vault"><Button variant="outline"><Archive className="h-4 w-4" /> Save to career vault</Button></Link>
            <Link href="/portfolio-generator"><Button variant="outline">Generate portfolio</Button></Link>
            <Link href="/resume/analyzer"><Button variant="outline">Update resume</Button></Link>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
