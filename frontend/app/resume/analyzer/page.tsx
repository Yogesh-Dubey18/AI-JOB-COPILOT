"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

// v2 category colors
const categoryColors: Record<string, string> = {
  content: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  format: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  optimization: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  bestPractices: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  applicationReadiness: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
};

const categoryLabels: Record<string, { label: string; description: string }> = {
  content: { label: "Content Quality", description: "Word count, action verbs, quantified bullet points, and summary quality." },
  format: { label: "ATS Format", description: "Required sections present, one-page fit, no table/column formatting risk." },
  optimization: { label: "Role Keyword Match", description: "Coverage of role-specific keywords from the target role keyword bank." },
  bestPractices: { label: "Best Practices", description: "Contact completeness, LinkedIn, GitHub, professional email." },
  applicationReadiness: { label: "Application Readiness", description: "Name, links, certifications, role alignment, and work presence." }
};

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="flex flex-col items-center">
      <span className={`text-5xl font-black tabular-nums ${color}`}>{score}</span>
      <span className="text-sm text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export default function ResumeAnalyzerPage() {
  const [resumeId, setResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [jobDescription, setJobDescription] = useState("");
  const [anonymizeForAnalysis, setAnonymizeForAnalysis] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [showWhyScores, setShowWhyScores] = useState(false);

  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => api.get<any[]>("/resumes"), retry: false });
  const analyze = useMutation({
    mutationFn: () => api.post<any>("/resumes/" + resumeId + "/analyze", { targetRole, jobDescription, anonymizeForAnalysis })
  });
  const result = analyze.data;
  const breakdown = result?.atsBreakdown || {};
  const keywordCoverage = result?.keywordCoverage;
  const jobCoverage = result?.jobDescriptionCoverage;
  const categoryScores: Record<string, { score: number; max: number; why: string }> = result?.categoryScores || {};

  const improve = useMutation({
    mutationFn: () => api.post<any>("/resumes/" + resumeId + "/improve", { targetRole })
  });
  const worldClass = useMutation({
    mutationFn: () => api.post<any>("/resumes/generate-world-class", { resumeId, targetRole })
  });
  const worldClassResume = worldClass.data?.generatedResume;

  useEffect(() => {
    if (result?.improvementSuggestions) {
      setSelectedSuggestions(result.improvementSuggestions);
    } else {
      setSelectedSuggestions([]);
    }
  }, [result]);

  const toggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(suggestion)
        ? prev.filter((s) => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  return (
    <AppShell>
      <PageHeading
        title="AI Resume ATS Analyzer"
        description="5-category ATS scoring with 'why this score' explanations, keyword coverage, and gap improvement action center."
      />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* --- Inputs Panel --- */}
        <Card>
          <CardHeader><CardTitle>Analyze resume</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
            >
              <option value="">Select resume</option>
              {(resumes.data || []).map((resume) => (
                <option key={resume._id} value={resume._id}>{resume.fileName}</option>
              ))}
            </select>
            <Input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target role (e.g. Full Stack Developer)"
              aria-label="Target role"
            />
            <textarea
              aria-label="Job description"
              className="min-h-36 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Paste a job description to calculate job-specific ATS keyword coverage (optional)."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />
            <label className="flex items-start gap-2 rounded-md border p-3 text-sm cursor-pointer">
              <input
                className="mt-1"
                type="checkbox"
                checked={anonymizeForAnalysis}
                onChange={(event) => setAnonymizeForAnalysis(event.target.checked)}
              />
              <span>
                <span className="block font-medium">Anonymize personal details for AI analysis</span>
                <span className="text-muted-foreground text-xs">Name, email, phone, and links are redacted from the AI payload. ATS heuristic still checks completeness.</span>
              </span>
            </label>
            <Button
              className="w-full"
              disabled={!resumeId || analyze.isPending}
              onClick={() => analyze.mutate()}
            >
              <Sparkles className="h-4 w-4" />
              {analyze.isPending ? "Analyzing..." : "Analyze resume"}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={!resumeId || worldClass.isPending}
              onClick={() => worldClass.mutate()}
            >
              <Sparkles className="h-4 w-4" />
              {worldClass.isPending ? "Generating..." : "Generate world-class resume"}
            </Button>
            {analyze.isError && (
              <p className="text-sm text-destructive" role="alert">
                {analyze.error instanceof Error ? analyze.error.message : "Analysis failed. Please try again."}
              </p>
            )}
            {worldClass.isError && (
              <p className="text-sm text-destructive" role="alert">
                {worldClass.error instanceof Error ? worldClass.error.message : "World-class resume generation failed. Please try again."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* --- Results Panel --- */}
        <div className="space-y-4">
          {/* Disclaimer */}
          <div
            className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"
            data-testid="ats-disclaimer"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p>
                <strong>Disclaimer:</strong> The ATS score is a heuristic estimate to help you find gaps — it is not a guarantee of employer ATS acceptance. AI-generated suggestions must be manually reviewed before applying.
              </p>
            </div>
          </div>

          {/* Score Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center gap-2">
                <ScoreGauge score={result?.atsScore || 0} label={result ? `${result.resumeLevel || ""} — ${targetRole}` : "Run analysis to see score"} />
                <Progress value={result?.atsScore || 0} />
                <p className="text-xs text-muted-foreground">{result?.recruiterView || "Score out of 100"}</p>
              </div>

              {/* 5-Category Breakdown (v2) */}
              {Object.keys(categoryScores).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">5-Category Breakdown</p>
                    <button
                      onClick={() => setShowWhyScores((s) => !s)}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {showWhyScores ? "Hide" : "Why this score?"}
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(categoryScores).map(([key, cat]) => {
                      const meta = categoryLabels[key];
                      const pct = Math.round((cat.score / cat.max) * 100);
                      return (
                        <div key={key} className="rounded-md border p-3 text-sm space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-xs">{meta?.label || key}</span>
                            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${categoryColors[key] || ""}`}>
                              {cat.score}/{cat.max}
                            </span>
                          </div>
                          <Progress value={pct} />
                          {showWhyScores && (
                            <p className="text-xs text-muted-foreground leading-snug">{cat.why}</p>
                          )}
                          {!showWhyScores && (
                            <p className="text-xs text-muted-foreground">{meta?.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legacy Breakdown (when categoryScores not available) */}
              {!Object.keys(categoryScores).length && result?.atsBreakdown && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Contact", breakdown.contactInformation, 10],
                    ["Skills", breakdown.skillsMatch, 25],
                    ["Projects", breakdown.experienceProjectQuality, 25],
                    ["Keywords", breakdown.keywords, 20],
                    ["Formatting", breakdown.formatting, 10],
                    ["Action verbs", breakdown.actionVerbs, 10]
                  ].map(([label, value, max]) => (
                    <div key={String(label)} className="rounded-md border p-3 text-sm">
                      <p className="font-semibold">{label}</p>
                      <p className="text-muted-foreground">{Number(value || 0)} / {max}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Anonymize notice */}
              {result?.privacyMode === "anonymized_for_analysis" && (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                  AI analysis used anonymized resume details. Redacted fields: {(result.redactedFields || []).join(", ") || "none"}.
                </div>
              )}
              {result && (
                <div className="flex justify-center border-t pt-4">
                  <Link href={`/jobs?fromResume=${resumeId}&role=${encodeURIComponent(targetRole)}`} className="w-full">
                    <Button className="w-full gap-2">
                      Find Matching Jobs
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* World-class resume generator */}
          {worldClassResume && (
            <Card className="border-primary/30" data-testid="world-class-resume-preview">
              <CardHeader>
                <CardTitle className="text-base">World-class generated resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {worldClass.data?.atsScore !== undefined && (
                  <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <p className="text-lg font-bold">Your ATS Score: {worldClass.data.atsScore}/100 ✅</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">Your resume is ready to beat 90% of applicants!</p>
                  </div>
                )}
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="font-bold">{worldClassResume.name || "Candidate"}</p>
                  <p className="text-muted-foreground">{worldClassResume.title || targetRole}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI/provider status: {worldClass.data?.provider?.providerConfigured ? "configured" : "mock/fallback"}.
                    Uses uploaded resume data only; review before applying.
                  </p>
                </div>
                {worldClassResume.summary ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Professional summary</p>
                    <p className="rounded border bg-background p-3 text-sm leading-relaxed">{worldClassResume.summary}</p>
                  </div>
                ) : null}
                {worldClassResume.skills ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Categorized skills</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {Object.entries(worldClassResume.skills).map(([category, skills]) => Array.isArray(skills) && skills.length ? (
                        <div key={category} className="rounded border p-3">
                          <p className="text-xs font-semibold capitalize text-muted-foreground">{category}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {skills.map((skill: string) => (
                              <span key={`${category}-${skill}`} className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{skill}</span>
                            ))}
                          </div>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                ) : null}
                {(worldClassResume.projects || []).length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Projects</p>
                    <div className="space-y-2">
                      {(worldClassResume.projects || []).map((project: any, index: number) => (
                        <div key={`${project.name}-${index}`} className="rounded border p-3 text-sm">
                          <p className="font-semibold">{project.name}</p>
                          {project.tech || (project.techStack && project.techStack.length) ? (
                            <p className="text-xs text-muted-foreground">
                              {project.tech || (Array.isArray(project.techStack) ? project.techStack.join(", ") : project.techStack)}
                            </p>
                          ) : null}
                          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                            {(project.bullets || []).map((bullet: string) => <li key={bullet}>{bullet}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {(worldClassResume.education || []).length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Education</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {(worldClassResume.education || []).map((education: any, index: number) => (
                        <li key={`${education.degree}-${index}`}>
                          <strong className="text-foreground">{education.degree}</strong>{" — "}
                          {[education.college || education.institution, education.year || education.duration, education.cgpa ? `CGPA: ${education.cgpa}` : ""].filter(Boolean).join(" | ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {(worldClassResume.certifications || []).length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Certifications</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {(worldClassResume.certifications || []).map((certification: string) => <li key={certification}>{certification}</li>)}
                    </ul>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  {worldClass.data?.resumeVersionId ? (
                    <Link href={`/pdf-export?versionId=${worldClass.data.resumeVersionId}`}>
                      <Button>Export world-class PDF</Button>
                    </Link>
                  ) : null}
                  <Link href={`/jobs?fromResume=${resumeId}&role=${encodeURIComponent(targetRole)}`}>
                    <Button variant="secondary">Find Matching Jobs</Button>
                  </Link>
                  <Link href="/resume/builder">
                    <Button variant="outline">Edit in resume builder</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Keyword Coverage */}
          {keywordCoverage && (
            <Card>
              <CardHeader><CardTitle className="text-base">Role keyword coverage</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{keywordCoverage.coveragePercent}%</strong> matched for <strong>{keywordCoverage.targetRole}</strong>
                    {" "}({keywordCoverage.detectedKeywords?.length}/{keywordCoverage.detectedKeywords?.length + (keywordCoverage.missingKeywords?.length || 0)} keywords)
                  </span>
                </div>
                {(keywordCoverage.detectedKeywords || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Detected keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(keywordCoverage.detectedKeywords || []).map((keyword: string) => (
                        <span key={keyword} className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs dark:bg-emerald-950/30 dark:text-emerald-200">{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(keywordCoverage.missingKeywords || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Missing keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(keywordCoverage.missingKeywords || []).map((keyword: string) => (
                        <span key={keyword} className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs dark:bg-amber-950/30 dark:text-amber-200">{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Job Description Coverage */}
          {jobCoverage && (
            <Card>
              <CardHeader><CardTitle className="text-base">Job description coverage</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    <strong>{jobCoverage.coveragePercent}%</strong> matched across <strong>{jobCoverage.keywordCount}</strong> detected job keywords
                  </span>
                </div>
                {(jobCoverage.missingKeywords || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Missing job-description keywords (add truthfully where applicable)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(jobCoverage.missingKeywords || []).slice(0, 12).map((keyword: string) => (
                        <span key={keyword} className="rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs dark:bg-rose-950/30 dark:text-rose-200">{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Strengths and Weaknesses */}
          {result && (
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Strengths</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {(result.strengths || []).map((item: string) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                    {(result.strengths || []).length === 0 && <li className="text-sm text-muted-foreground">Run analysis to see strengths.</li>}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><XCircle className="h-4 w-4 text-rose-600" /> Weaknesses</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {(result.weaknesses || []).map((item: string) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" />
                        {item}
                      </li>
                    ))}
                    {(result.weaknesses || []).length === 0 && <li className="text-sm text-muted-foreground">No weaknesses detected.</li>}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gap Improvement Action Center */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gap Improvement Action Center</CardTitle>
              </CardHeader>
              <CardContent data-testid="suggestions-checklist" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the ATS recommendations you want to apply to your tailored resume draft. Review all suggestions before use.
                </p>
                <div className="space-y-2">
                  {(result.improvementSuggestions || []).map((suggestion: string, idx: number) => {
                    const isSelected = selectedSuggestions.includes(suggestion);
                    return (
                      <label key={idx} className="flex items-start gap-3 rounded border p-2.5 text-sm hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={isSelected}
                          onChange={() => toggleSuggestion(suggestion)}
                        />
                        <span>{suggestion}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSuggestions(result.improvementSuggestions || [])}
                  >
                    Select All
                  </Button>
                  <Button
                    data-testid="apply-suggestions-button"
                    disabled={improve.isPending || selectedSuggestions.length === 0}
                    onClick={() => improve.mutate()}
                  >
                    {improve.isPending ? "Applying..." : "Apply Checked Suggestions"}
                  </Button>
                </div>
                {improve.isError && (
                  <p className="text-sm text-destructive" role="alert">
                    {improve.error instanceof Error ? improve.error.message : "Failed to apply improvements."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Draft Preview */}
          {improve.data && (
            <Card className="border-emerald-300" data-testid="draft-preview">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <p className="font-bold text-base text-emerald-800 dark:text-emerald-300">Tailored Resume Draft Preview</p>
                  <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Draft Score: {improve.data.atsScore}%
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Updated Summary</p>
                  <p className="text-sm rounded border bg-muted/40 p-3 leading-relaxed">{improve.data.content?.summary}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Updated Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(improve.data.content?.skills || []).map((skill: string) => (
                      <span key={skill} className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{skill}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Improved Projects / Bullets</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {(improve.data.content?.projects || []).map((project: string, i: number) => (
                      <li key={i}>{project}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Link href={`/pdf-export?versionId=${improve.data._id}`}>
                    <Button>Generate Updated Resume PDF</Button>
                  </Link>
                  <Link href={`/jobs?fromResume=${resumeId}&role=${encodeURIComponent(targetRole)}`}>
                    <Button variant="outline" data-testid="discover-jobs-button">Discover Matching Jobs</Button>
                  </Link>
                  <Link href="/guided-workflow">
                    <Button variant="ghost">Continue to Application Workflow</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parser warnings */}
          {(result?.parserWarnings || []).length > 0 && (
            <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p>{result.parserWarnings.join(" ")}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
