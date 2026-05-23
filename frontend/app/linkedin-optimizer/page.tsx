"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Copy, Info, Linkedin, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const CONNECTION_TEMPLATES = [
  {
    label: "Recruiter outreach",
    template: "Hi [Name], I noticed your team is hiring for [Role] at [Company]. I have [X] years of experience in [Skill]. I would love to connect and learn more about the opportunity."
  },
  {
    label: "Referral request",
    template: "Hi [Name], I have been following [Company]'s work on [Project/Product] and I am very interested in the [Role] opening. Would you be open to a quick chat or a referral? Happy to share my resume."
  },
  {
    label: "Alumni networking",
    template: "Hi [Name], I noticed we both studied at [College]. I am currently exploring roles in [Domain] and would love to get your perspective on the industry. Would you be open to a 15-minute chat?"
  },
  {
    label: "Cold outreach — hiring manager",
    template: "Hi [Name], I admire the work your team is doing on [Product/Area]. I have [X] years of experience in [Skill] and have worked on [Relevant Work]. I would love to connect and discuss if there are any relevant openings."
  }
];

const HEADLINE_TIPS = [
  "Lead with your current title + specialisation, not just your job title",
  "Include 2-3 top skills that match your target role keywords",
  "Add quantified impact where possible (e.g. '5+ years | 10× scale')",
  "Use | or · as separators — avoid jargon and buzzwords",
  "Keep it under 220 characters (LinkedIn's display limit)"
];

const SUMMARY_TIPS = [
  "Start with a one-line hook: what you build and who you help",
  "List your top 3-5 technical strengths with examples",
  "Include a call to action: 'Open to X opportunities' or 'DM for referrals'",
  "Use line breaks every 2-3 sentences — walls of text lose recruiters",
  "Mirror keywords from the job descriptions you are targeting"
];

export default function LinkedInOptimizerPage() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const optimize = useMutation({
    mutationFn: (data: FormData) => api.post<any>("/ai/linkedin-optimizer", {
      currentHeadline: data.get("currentHeadline"),
      currentSummary: data.get("currentSummary"),
      targetRole: data.get("targetRole"),
      skills: String(data.get("skills") || "").split(",").map((s) => s.trim()).filter(Boolean),
      message: `Optimize my LinkedIn profile for ${data.get("targetRole")}.`
    })
  });

  const result = optimize.data;

  function copyTemplate(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <AppShell>
      <PageHeading
        title="LinkedIn optimizer & networking"
        description="Optimize your LinkedIn headline and summary for your target role. Get connection message templates for recruiters, hiring managers, and referrals."
      />

      <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>LinkedIn optimization is AI-assisted. Always review generated headlines and summaries before updating your profile. Use connection templates as starting points — personalise them before sending.</p>
        </div>
      </div>

      {/* Tips */}
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Headline tips</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {HEADLINE_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">About/summary tips</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {SUMMARY_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* AI Optimizer */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />AI profile optimizer</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); optimize.mutate(new FormData(e.currentTarget)); }}
            className="space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Target role</label>
                <Input name="targetRole" placeholder="e.g. Senior Full Stack Developer" aria-label="Target role" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Top skills (comma-separated)</label>
                <Input name="skills" placeholder="e.g. React, Node.js, TypeScript, AWS" aria-label="Skills" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Current LinkedIn headline</label>
              <Input name="currentHeadline" placeholder="e.g. Software Engineer at XYZ" aria-label="Current headline" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Current About / summary (optional)</label>
              <textarea
                name="currentSummary"
                placeholder="Paste your current LinkedIn About section here..."
                aria-label="Current summary"
                className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" disabled={optimize.isPending}>
              <Sparkles className="h-4 w-4" />{optimize.isPending ? "Optimizing..." : "Generate optimized profile"}
            </Button>
          </form>
          {optimize.isError ? <p role="alert" className="mt-2 text-sm text-danger">{optimize.error instanceof Error ? optimize.error.message : "Could not optimize profile."}</p> : null}
        </CardContent>
      </Card>

      {/* AI Result */}
      {result ? (
        <div className="mb-5 space-y-4">
          {result.headline ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Optimized headline</CardTitle></CardHeader>
              <CardContent>
                <p className="rounded-md bg-muted/60 p-3 font-medium">{result.headline}</p>
                <Button variant="ghost" className="mt-2 h-7 px-2 text-xs" onClick={() => navigator.clipboard.writeText(result.headline)}>
                  <Copy className="mr-1 h-3.5 w-3.5" />Copy
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {result.summary ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Optimized About section</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap rounded-md bg-muted/60 p-3 text-sm">{result.summary}</p>
                <Button variant="ghost" className="mt-2 h-7 px-2 text-xs" onClick={() => navigator.clipboard.writeText(result.summary)}>
                  <Copy className="mr-1 h-3.5 w-3.5" />Copy
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {(!result.headline && !result.summary) ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Result</CardTitle></CardHeader>
              <CardContent><pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(result, null, 2)}</pre></CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Connection Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Linkedin className="h-4 w-4 text-blue-600" />Connection message templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Replace [Name], [Role], [Company], [Skill], and [X] with specific values before sending. Personalised messages get 3× more responses.</p>
          {CONNECTION_TEMPLATES.map((t, i) => (
            <div key={t.label} className="rounded-md border p-3">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{t.label}</p>
              <p className="text-sm">{t.template}</p>
              <Button
                variant="ghost"
                className="mt-2 h-7 px-2 text-xs"
                onClick={() => copyTemplate(t.template, i)}
              >
                <Copy className="mr-1 h-3.5 w-3.5" />
                {copiedIdx === i ? "Copied!" : "Copy template"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
