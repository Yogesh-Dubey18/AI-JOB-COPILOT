"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Target, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function CompareJobPage() {
  const [resumeId1, setResumeId1] = useState("");
  const [resumeId2, setResumeId2] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: () => api.get<any[]>("/resumes"),
    retry: false
  });

  const resumes = resumesQuery.data || [];

  const compareJobMutation = useMutation({
    mutationFn: () => api.post<any>("/resumes/compare-job", { resumeId1, resumeId2, jobDescription })
  });

  const result = compareJobMutation.data;

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeading
          title="🎯 Compare Resumes vs Job Description"
          description="Evaluate two resumes against a specific Job Description to discover which candidate fits best."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Resume 1 Selector */}
          <Card className={result?.winner === "resume1" ? "border-2 border-emerald-500 shadow-md bg-emerald-50/20 dark:bg-emerald-950/10" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                📄 Resume 1
                {result?.winner === "resume1" && (
                  <span className="bg-emerald-500 text-white text-xs font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> BEST FIT
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={resumeId1}
                onChange={(e) => setResumeId1(e.target.value)}
                className="w-full rounded-md border p-2.5 text-sm bg-background"
              >
                <option value="">Select Resume 1...</option>
                {resumes.map((r: any) => (
                  <option key={r._id} value={r._id}>
                    {r.fileName || r.parsedData?.name || "Untitled Resume"}
                  </option>
                ))}
              </select>

              {result && (
                <div className="space-y-3 pt-2">
                  <div className="text-center p-4 rounded-lg bg-card border">
                    <div className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {result.resume1Match}%
                    </div>
                    <div className="text-xs font-bold text-muted-foreground mt-1">JD Match Score</div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Matched Job Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {result.resume1Matched?.map((kw: string) => (
                        <span key={kw} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs px-2 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                      {(!result.resume1Matched || result.resume1Matched.length === 0) && (
                        <span className="text-xs text-muted-foreground">No direct keyword matches</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume 2 Selector */}
          <Card className={result?.winner === "resume2" ? "border-2 border-emerald-500 shadow-md bg-emerald-50/20 dark:bg-emerald-950/10" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                📄 Resume 2
                {result?.winner === "resume2" && (
                  <span className="bg-emerald-500 text-white text-xs font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> BEST FIT
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={resumeId2}
                onChange={(e) => setResumeId2(e.target.value)}
                className="w-full rounded-md border p-2.5 text-sm bg-background"
              >
                <option value="">Select Resume 2...</option>
                {resumes.map((r: any) => (
                  <option key={r._id} value={r._id}>
                    {r.fileName || r.parsedData?.name || "Untitled Resume"}
                  </option>
                ))}
              </select>

              {result && (
                <div className="space-y-3 pt-2">
                  <div className="text-center p-4 rounded-lg bg-card border">
                    <div className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {result.resume2Match}%
                    </div>
                    <div className="text-xs font-bold text-muted-foreground mt-1">JD Match Score</div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Matched Job Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {result.resume2Matched?.map((kw: string) => (
                        <span key={kw} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs px-2 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                      {(!result.resume2Matched || result.resume2Matched.length === 0) && (
                        <span className="text-xs text-muted-foreground">No direct keyword matches</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Job Description Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              Target Job Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              rows={6}
              placeholder="Paste the target job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full rounded-md border p-3 text-sm bg-background"
            />
            <Button
              size="lg"
              disabled={!resumeId1 || !resumeId2 || !jobDescription || compareJobMutation.isPending}
              onClick={() => compareJobMutation.mutate()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-base"
            >
              {compareJobMutation.isPending ? "Evaluating Fit..." : "🎯 Which Fits Better?"}
            </Button>
          </CardContent>
        </Card>

        {/* Recommendation Callout */}
        {result?.recommendation && (
          <Card className="border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="pt-6 text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Recommendation</span>
              <h3 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100">{result.recommendation}</h3>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
