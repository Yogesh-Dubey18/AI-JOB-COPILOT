"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Info, Sparkles, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function SkillgapPage() {
  const [targetRole, setTargetRole] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");

  const analyze = useMutation({
    mutationFn: () => api.post<any>("/ai/skill-gap", {
      targetRole: targetRole.trim() || "Full Stack Developer",
      currentSkills: currentSkills.split(",").map((s) => s.trim()).filter(Boolean),
      message: `Analyze skill gap for ${targetRole}. Current skills: ${currentSkills}`
    })
  });

  const result = analyze.data;

  return (
    <AppShell>
      <PageHeading
        title="Skill gap roadmap"
        description="Compare your current skills to a target role and get a prioritised 7-day and 30-day learning roadmap with specific resources."
      />

      <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Skill gap analysis uses AI to compare your profile to the target role. Results are a starting point — validate the suggested resources before committing learning time. AI provider status: <Link href="/settings/integrations" className="underline">check integrations</Link>.</p>
        </div>
      </div>

      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />Analyze my skill gap</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Target role</label>
              <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Backend Developer, Data Engineer" aria-label="Target role" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Your current skills (comma-separated)</label>
              <Input value={currentSkills} onChange={(e) => setCurrentSkills(e.target.value)} placeholder="e.g. JavaScript, React, Node.js, MongoDB" aria-label="Current skills" />
            </div>
          </div>
          <Button
            className="mt-3"
            disabled={analyze.isPending || !targetRole.trim()}
            onClick={() => analyze.mutate()}
          >
            <Sparkles className="h-4 w-4" />{analyze.isPending ? "Analyzing..." : "Generate roadmap"}
          </Button>
          {analyze.isError ? <p role="alert" className="mt-2 text-sm text-danger">{analyze.error instanceof Error ? analyze.error.message : "Could not generate roadmap."}</p> : null}
        </CardContent>
      </Card>

      {result ? (
        <div className="space-y-5">
          {/* Missing skills */}
          {(result.missingSkills || result.gaps || []).length ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Skills to close</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(result.missingSkills || result.gaps || []).map((s: string) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      <XCircle className="h-3 w-3" />{s}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Strong match skills */}
          {(result.matchingSkills || result.strengths || []).length ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Already strong</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(result.matchingSkills || result.strengths || []).map((s: string) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />{s}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* 7-day roadmap */}
          {(result.weekPlan || result.sevenDayPlan || []).length ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4" />7-day sprint plan</CardTitle></CardHeader>
              <CardContent>
                <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                  {(result.weekPlan || result.sevenDayPlan || []).map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : null}

          {/* 30-day roadmap */}
          {(result.monthPlan || result.thirtyDayPlan || []).length ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4" />30-day learning roadmap</CardTitle></CardHeader>
              <CardContent>
                <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                  {(result.monthPlan || result.thirtyDayPlan || []).map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : null}

          {/* Resources */}
          {(result.resources || result.learningResources || []).length ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Recommended resources</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {(result.resources || result.learningResources || []).map((r: any, i: number) => (
                    <li key={i}>
                      {typeof r === "string" ? r : (
                        <span>{r.skill || r.topic}: {r.resource || r.url}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {/* Raw fallback */}
          {!result.missingSkills && !result.gaps && !result.weekPlan && !result.sevenDayPlan ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Analysis result</CardTitle></CardHeader>
              <CardContent><pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(result, null, 2)}</pre></CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link href="/career-vault"><Button variant="outline"><BookOpen className="h-4 w-4" /> Add skills to career vault</Button></Link>
            <Link href="/resume/analyzer"><Button variant="outline">Re-run ATS analysis</Button></Link>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
