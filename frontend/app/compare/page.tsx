"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Trophy, Upload, Zap } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function CompareResumesPage() {
  const [resumeId1, setResumeId1] = useState("");
  const [resumeId2, setResumeId2] = useState("");

  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: () => api.get<any[]>("/resumes"),
    retry: false
  });

  const resumes = resumesQuery.data || [];

  const compareMutation = useMutation({
    mutationFn: () => api.post<any>("/resumes/compare", { resumeId1, resumeId2 })
  });

  const result = compareMutation.data;

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeading
          title="🔄 Compare Two Resumes"
          description="Analyze two resumes side-by-side to compare ATS scores, letter grades, strengths, and weaknesses."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Resume 1 Selector */}
          <Card className={result?.winner === "resume1" ? "border-2 border-emerald-500 shadow-md bg-emerald-50/20 dark:bg-emerald-950/10" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                📄 Resume 1 (Primary)
                {result?.winner === "resume1" && (
                  <span className="bg-emerald-500 text-white text-xs font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> WINNER
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
                    {r.fileName || r.parsedData?.name || "Untitled Resume"} ({new Date(r.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>

              {result?.resume1 && (
                <div className="space-y-3 pt-2">
                  <div className="text-center p-4 rounded-lg bg-card border">
                    <div className="text-5xl font-extrabold text-purple-600 dark:text-purple-400">
                      {result.resume1.letterGrade}
                    </div>
                    <div className="text-2xl font-bold mt-1">{result.resume1.atsScore}/100</div>
                    <div className="text-sm font-semibold text-muted-foreground">{result.resume1.gradeLabel}</div>
                    <p className="text-xs font-bold text-muted-foreground mt-2">{result.resume1.name}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Key Strengths</p>
                    <ul className="space-y-1">
                      {result.resume1.strengths?.map((s: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Weaknesses</p>
                    <ul className="space-y-1">
                      {result.resume1.weaknesses?.map((w: string, idx: number) => (
                        <li key={idx} className="text-xs text-muted-foreground">
                          • {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume 2 Selector */}
          <Card className={result?.winner === "resume2" ? "border-2 border-emerald-500 shadow-md bg-emerald-50/20 dark:bg-emerald-950/10" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                📄 Resume 2 (Comparison)
                {result?.winner === "resume2" && (
                  <span className="bg-emerald-500 text-white text-xs font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> WINNER
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
                    {r.fileName || r.parsedData?.name || "Untitled Resume"} ({new Date(r.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>

              {result?.resume2 && (
                <div className="space-y-3 pt-2">
                  <div className="text-center p-4 rounded-lg bg-card border">
                    <div className="text-5xl font-extrabold text-purple-600 dark:text-purple-400">
                      {result.resume2.letterGrade}
                    </div>
                    <div className="text-2xl font-bold mt-1">{result.resume2.atsScore}/100</div>
                    <div className="text-sm font-semibold text-muted-foreground">{result.resume2.gradeLabel}</div>
                    <p className="text-xs font-bold text-muted-foreground mt-2">{result.resume2.name}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Key Strengths</p>
                    <ul className="space-y-1">
                      {result.resume2.strengths?.map((s: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Weaknesses</p>
                    <ul className="space-y-1">
                      {result.resume2.weaknesses?.map((w: string, idx: number) => (
                        <li key={idx} className="text-xs text-muted-foreground">
                          • {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Controls */}
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!resumeId1 || !resumeId2 || compareMutation.isPending}
            onClick={() => compareMutation.mutate()}
            className="w-full sm:w-auto px-8 py-6 font-bold text-base bg-purple-600 hover:bg-purple-700 text-white"
          >
            {compareMutation.isPending ? "Comparing Resumes..." : "🔄 Compare Resumes Side-by-Side"}
          </Button>
        </div>

        {/* Verdict Callout */}
        {result?.verdict && (
          <Card className="border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="pt-6 text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Analysis Verdict</span>
              <h3 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100">{result.verdict}</h3>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
