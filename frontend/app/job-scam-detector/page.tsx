"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, ShieldAlert, Sparkles, RefreshCw, Info, HelpCircle } from "lucide-react";
import { useState, useId } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ScamResult {
  trustScore: number;
  riskLevel: "high" | "medium" | "low" | string;
  redFlags: string[];
  recommendation: string;
  verificationSteps: string[];
}

export default function JobScamDetectorPage() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [recruiter, setRecruiter] = useState("");
  const [description, setDescription] = useState("");
  const formId = useId();

  const scamCheck = useMutation({
    mutationFn: () =>
      api.post<ScamResult>("/ai/scam-check", {
        jobTitle: title,
        company,
        recruiterContact: recruiter,
        jobDescription: description
      }),
    onSuccess: () => {
      toast.success("Job posting analysis complete!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to run scam analysis.");
    }
  });

  const result = scamCheck.data;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20";
    if (score >= 50) return "text-amber-500 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20";
    return "text-rose-500 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20";
  };

  const getRiskBadge = (level: string) => {
    const l = level.toLowerCase();
    if (l === "low" || l === "safe") {
      return <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-3 py-1 text-xs font-bold uppercase tracking-wider">Safe / Low Risk</span>;
    }
    if (l === "medium" || l === "suspicious") {
      return <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-3 py-1 text-xs font-bold uppercase tracking-wider">Suspicious / Medium Risk</span>;
    }
    return <span className="rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse">Critical / High Risk</span>;
  };

  return (
    <AppShell>
      <PageHeading
        title="AI Job Scam Detector"
        description="Verify recruitment postings for upfront fees, suspicious company details, fake HR domains, and structural scams."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Input Form Panel */}
        <Card className="border shadow-md bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Check a Job Posting</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              id={formId}
              onSubmit={(e) => {
                e.preventDefault();
                scamCheck.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor={`${formId}-title`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job Title</label>
                  <Input id={`${formId}-title`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data Entry Operator" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${formId}-company`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company Name</label>
                  <Input id={`${formId}-company`} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Infosys / Unknown" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${formId}-recruiter`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recruiter Contact / Email</label>
                <Input id={`${formId}-recruiter`} value={recruiter} onChange={(e) => setRecruiter(e.target.value)} placeholder="e.g. hr-wipro@gmail.com, WhatsApp text" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${formId}-desc`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job Description or Message</label>
                <Textarea
                  id={`${formId}-desc`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste the job description text, social media post, or WhatsApp offer message here..."
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={!description.trim() || scamCheck.isPending}>
                {scamCheck.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Job Details...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Check for Scams
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="border shadow-md flex flex-col justify-start">
          <CardHeader>
            <CardTitle className="text-lg">Scam Analysis Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 flex-1 flex flex-col justify-center">
            {scamCheck.isPending && (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Running heuristic checks & pattern matcher...</p>
              </div>
            )}

            {!scamCheck.isPending && !result && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">Ready for scam analysis</p>
                <p className="text-xs max-w-xs mt-1">Paste the job posting description on the left to evaluate its credibility score.</p>
              </div>
            )}

            {!scamCheck.isPending && result && (
              <div className="space-y-5">
                {/* Score & Risk Level Banner */}
                <div className={`rounded-lg border p-4 text-center ${getScoreColor(result.trustScore)}`}>
                  <div className="text-5xl font-black tracking-tighter">{result.trustScore}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mt-1 text-muted-foreground">Trust Score (0-100)</div>
                  <div className="mt-3.5">{getRiskBadge(result.riskLevel)}</div>
                </div>

                {/* AI Recommendation */}
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <span>AI Safety Verdict</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>

                {/* Red Flags List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detected Red Flags</h3>
                  {result.redFlags && result.redFlags.length > 0 ? (
                    <ul className="space-y-1.5">
                      {result.redFlags.map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/10 p-2 rounded border border-rose-100 dark:border-rose-950/20">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded border border-emerald-100 dark:border-emerald-950/20">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>No critical red flags detected. The listing appears standard.</span>
                    </div>
                  )}
                </div>

                {/* Verification Check-steps */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recommended Verification Steps</h3>
                  <ul className="space-y-1.5">
                    {(result.verificationSteps || []).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="rounded-md border bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-950/20 p-3 flex gap-2 items-start text-xs text-blue-800 dark:text-blue-300">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
              <p>AI Scam checks flag common patterns. They do not substitute for official verifications (e.g. checking company registration in the Ministry of Corporate Affairs database).</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
