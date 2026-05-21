"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export default function ResumeAnalyzerPage() {
  const [resumeId, setResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [jobDescription, setJobDescription] = useState("");
  const [anonymizeForAnalysis, setAnonymizeForAnalysis] = useState(false);
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => api.get<any[]>("/resumes"), retry: false });
  const analyze = useMutation({ mutationFn: () => api.post<any>("/resumes/" + resumeId + "/analyze", { targetRole, jobDescription, anonymizeForAnalysis }) });
  const result = analyze.data;
  const breakdown = result?.atsBreakdown || {};
  const keywordCoverage = result?.keywordCoverage;
  const jobCoverage = result?.jobDescriptionCoverage;
  return (
    <AppShell>
      <PageHeading title="AI resume ATS analyzer" description="Select a resume and target role to get ATS score, section scores, strengths, weaknesses, missing keywords, recruiter view, and improvement suggestions." />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Analyze resume</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select className="h-10 w-full rounded-md border bg-background px-3" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
              <option value="">Select resume</option>
              {(resumes.data || []).map((resume) => <option key={resume._id} value={resume._id}>{resume.fileName}</option>)}
            </select>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
            <textarea
              aria-label="Job description"
              className="min-h-36 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Paste a job description to calculate job-specific ATS keyword coverage."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />
            <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
              <input className="mt-1" type="checkbox" checked={anonymizeForAnalysis} onChange={(event) => setAnonymizeForAnalysis(event.target.checked)} />
              <span>
                <span className="block font-medium">Anonymize personal details for AI analysis</span>
                <span className="text-muted-foreground">Name, email, phone, and links are redacted from the AI payload while the ATS heuristic still checks resume completeness.</span>
              </span>
            </label>
            <Button disabled={!resumeId || analyze.isPending} onClick={() => analyze.mutate()}><Sparkles className="h-4 w-4" /> {analyze.isPending ? "Analyzing..." : "Analyze resume"}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>ATS result</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-black">{result?.atsScore || 0}</div>
            <Progress value={result?.atsScore || 0} />
            {keywordCoverage ? (
              <div className="rounded-md border p-3">
                <p className="text-sm font-semibold">Role keyword coverage</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{keywordCoverage.coveragePercent}% matched for {keywordCoverage.targetRole}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(keywordCoverage.detectedKeywords || []).map((keyword: string) => <span key={keyword} className="rounded-md border px-2 py-1 text-xs">{keyword}</span>)}
                </div>
              </div>
            ) : null}
            {jobCoverage ? (
              <div className="rounded-md border p-3">
                <p className="text-sm font-semibold">Job description coverage</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{jobCoverage.coveragePercent}% matched across {jobCoverage.keywordCount} detected job keywords</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(jobCoverage.missingKeywords || []).slice(0, 10).map((keyword: string) => <span key={keyword} className="rounded-md border px-2 py-1 text-xs">{keyword}</span>)}
                </div>
              </div>
            ) : null}
            {result?.privacyMode === "anonymized_for_analysis" ? (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                AI analysis used anonymized resume details. Redacted fields: {(result.redactedFields || []).join(", ") || "none"}.
              </div>
            ) : null}
            {result?.atsBreakdown ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Contact", breakdown.contactInformation, 10],
                  ["Skills", breakdown.skillsMatch, 25],
                  ["Projects", breakdown.experienceProjectQuality, 25],
                  ["Keywords", breakdown.keywords, 20],
                  ["Formatting", breakdown.formatting, 10],
                  ["Action verbs", breakdown.actionVerbs, 10]
                ].map(([label, value, max]) => <div key={String(label)} className="rounded-md border p-3 text-sm"><p className="font-semibold">{label}</p><p className="text-muted-foreground">{Number(value || 0)} / {max}</p></div>)}
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {["strengths", "weaknesses", "missingKeywords", "improvementSuggestions"].map((key) => <div key={key} className="rounded-md border p-3"><p className="font-semibold">{key}</p><ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">{(result?.[key] || []).map((item: string) => <li key={item}>{item}</li>)}</ul></div>)}
            </div>
            {(result?.parserWarnings || []).length ? <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" /><p>{result.parserWarnings.join(" ")}</p></div> : null}
            <p className="text-sm text-muted-foreground">{result?.recruiterView || "Run an analysis to see recruiter view."}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
