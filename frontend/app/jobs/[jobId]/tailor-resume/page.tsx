"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Download, FileText, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export default function TailorResumePage() {
  const params = useParams<{ jobId: string }>();
  const [baseResumeId, setBaseResumeId] = useState("");

  const resumes = useQuery({
    queryKey: ["resumes"],
    queryFn: () => api.get<any[]>("/resumes"),
    retry: false
  });

  const tailor = useMutation({
    mutationFn: () => api.post<any>("/resumes/generate-world-class", { resumeId: baseResumeId, jobId: params.jobId })
  });

  const data = tailor.data?.data || tailor.data;

  return (
    <AppShell>
      <PageHeading
        title="Tailor resume for job"
        description="Select a base resume, extract required keywords, rewrite summary and skills truthfully, improve project bullets, and save a new resume version."
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select base resume & tailor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                aria-label="Select base resume"
                className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
                value={baseResumeId}
                onChange={(e) => setBaseResumeId(e.target.value)}
              >
                <option value="">Select a base resume</option>
                {(resumes.data || []).map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.fileName}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => tailor.mutate()}
                disabled={!baseResumeId || tailor.isPending}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {tailor.isPending ? "Generating..." : "Generate matched resume for this job"}
              </Button>
            </div>
            {tailor.isError && (
              <p className="text-sm text-destructive" role="alert">
                {tailor.error instanceof Error ? tailor.error.message : "Tailoring failed."}
              </p>
            )}
          </CardContent>
        </Card>

        {data && (
          <Card className="border-emerald-300">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between text-base text-emerald-800 dark:text-emerald-300">
                <span>ATS Tailoring Success</span>
                <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Version Saved
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* ATS Scores Comparison */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border p-4 text-center space-y-2">
                  <span className="text-sm text-muted-foreground font-medium">Before ATS Match</span>
                  <div className="text-4xl font-extrabold text-amber-600">
                    {data.beforeAtsScore}%
                  </div>
                  <Progress value={data.beforeAtsScore} className="h-2" />
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50/20 p-4 text-center space-y-2 dark:border-emerald-800">
                  <span className="text-sm text-emerald-800 dark:text-emerald-400 font-medium">After ATS Match</span>
                  <div className="text-4xl font-extrabold text-emerald-600">
                    {data.atsScore}%
                  </div>
                  <Progress value={data.atsScore} className="h-2 bg-emerald-100 dark:bg-emerald-950" />
                </div>
              </div>

              {/* Added / Inferred Keywords (Rule 4 Transparency) */}
              {((data.addedKeywords && data.addedKeywords.length > 0) || (data.generatedResume?.addedKeywords && data.generatedResume.addedKeywords.length > 0)) && (
                <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Honest Added Keywords (Inferred from Work & Tech Context)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.addedKeywords || data.generatedResume?.addedKeywords || []).map((keyword: string) => (
                      <span key={keyword} className="rounded-md border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                        + {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Genuine Skill Gaps (Rule 1 & 7 Transparency) */}
              {((data.genuineGaps && data.genuineGaps.length > 0) || (data.generatedResume?.genuineGaps && data.generatedResume.genuineGaps.length > 0)) && (
                <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Genuine Skill Gaps (Not Fabricated — Consider Learning Before Applying)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.genuineGaps || data.generatedResume?.genuineGaps || []).map((gap: string) => (
                      <span key={gap} className="rounded-md border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                        ⚠ {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Anti Keyword-Stuffing Warnings (Rule 3) */}
              {((data.keywordStuffingWarnings && data.keywordStuffingWarnings.length > 0) || (data.generatedResume?.keywordStuffingWarnings && data.generatedResume.keywordStuffingWarnings.length > 0)) && (
                <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900 dark:bg-rose-950/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                    Anti Keyword-Stuffing Warnings
                  </p>
                  <ul className="list-inside list-disc text-xs text-rose-700 dark:text-rose-300 space-y-1">
                    {(data.keywordStuffingWarnings || data.generatedResume?.keywordStuffingWarnings || []).map((warning: string, i: number) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Target ATS Keywords */}
              {data.generatedResume?.atsKeywords?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target ATS Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.generatedResume.atsKeywords.map((keyword: string) => (
                      <span key={keyword} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Updated Summary */}
              {data.generatedResume?.summary && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Updated Summary</p>
                  <p className="text-sm rounded-md border bg-muted/30 p-4 leading-relaxed whitespace-pre-line">
                    {data.generatedResume.summary}
                  </p>
                </div>
              )}

              {/* Updated Skills */}
              {data.generatedResume?.skills && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Updated Skills</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {Object.entries(data.generatedResume.skills).map(([category, skills]) => Array.isArray(skills) && skills.length ? (
                      <div key={category} className="rounded border p-3">
                        <p className="text-xs font-semibold capitalize text-muted-foreground">{category}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {skills.map((skill: string) => (
                            <span key={`${category}-${skill}`} className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Improved Projects */}
              {data.generatedResume?.projects?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Improved Projects</p>
                  <div className="space-y-3">
                    {data.generatedResume.projects.map((project: any, i: number) => (
                      <div key={i} className="rounded-md border p-3 text-sm">
                        <p className="font-semibold">{project.name}</p>
                        {project.tech && <p className="text-xs text-muted-foreground mb-2">{project.tech}</p>}
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          {(project.bullets || []).map((bullet: string, j: number) => (
                            <li key={j} className="leading-relaxed">{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 border-t pt-5">
                <Link href={`/pdf-export?versionId=${data.resumeVersionId}`}>
                  <Button className="gap-2">
                    <Download className="h-4 w-4" /> Download tailored resume PDF
                  </Button>
                </Link>
                <Link href="/guided-workflow">
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" /> Go to Workflow
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
