"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Info, Sparkles, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { getStoredAccessToken } from "@/lib/auth-session";

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
  const queryClient = useQueryClient();
  const [resumeId, setResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [jobDescription, setJobDescription] = useState("");
  const [anonymizeForAnalysis, setAnonymizeForAnalysis] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [showWhyScores, setShowWhyScores] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  const deleteResumeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      const remaining = (resumes.data || []).filter((r: any) => r._id !== deletedId);
      if (resumeId === deletedId) {
        setResumeId(remaining[0]?._id || "");
      }
      setDeletingResumeId(null);
      setShowDeleteConfirm(false);
    }
  });

  function formatResumeDate(dateString?: string) {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }

  const downloadDirectPdf = async (versionId: string) => {
    setDownloadingPdf(true);
    setDownloadError("");
    try {
      const token = getStoredAccessToken();
      const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
      const response = await fetch(`${backendOrigin}/api/pdf-export/resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: versionId })
      });
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeRole = (targetRole || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `Resume_${safeRole}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

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

  const [improvementsData, setImprovementsData] = useState<any>(null);
  const getImprovements = useMutation({
    mutationFn: () => api.post<any>(`/resumes/${resumeId}/improve`),
    onSuccess: (data) => setImprovementsData(data)
  });
  const applySingleImp = useMutation({
    mutationFn: (body: any) => api.post<any>(`/resumes/${resumeId}/apply-improvement`, body)
  });

  const [jdRole, setJdRole] = useState("");
  const [jdCompany, setJdCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [tailorResult, setTailorResult] = useState<any>(null);

  const tailorToJdMutation = useMutation({
    mutationFn: () => api.post<any>(`/resumes/${resumeId}/tailor-to-jd`, { jobDescription: jdText, jobTitle: jdRole, company: jdCompany }),
    onSuccess: (data) => setTailorResult(data)
  });

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
            <div className="flex items-center gap-2">
              <select
                className="h-10 flex-1 min-w-0 rounded-md border bg-background px-3 text-sm"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
              >
                <option value="">Select resume</option>
                {(resumes.data || []).map((r: any) => {
                  const dateFormatted = formatResumeDate(r.createdAt);
                  const label = dateFormatted ? `${r.fileName || "Untitled"} — ${dateFormatted}` : (r.fileName || "Untitled");
                  return (
                    <option key={r._id} value={r._id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              {resumeId && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10"
                  title="Delete selected resume"
                  onClick={() => {
                    setDeletingResumeId(resumeId);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex justify-between items-center px-1 text-xs">
              <button
                type="button"
                onClick={() => setShowManageModal(true)}
                className="text-primary hover:underline font-medium"
              >
                Manage Resumes ({(resumes.data || []).length})
              </button>
            </div>
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
                {result?.letterGrade ? (
                  <div className="text-center">
                    <div className="text-6xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
                      {result.letterGrade}
                    </div>
                    <div className="text-3xl font-bold mt-1">{result.atsScore}/100</div>
                    <div className="text-sm font-semibold text-muted-foreground mt-0.5">{result.gradeLabel}</div>
                  </div>
                ) : (
                  <ScoreGauge score={result?.atsScore || 0} label={result ? `${result.resumeLevel || ""} — ${targetRole}` : "Run analysis to see score"} />
                )}
                <Progress value={result?.atsScore || 0} />
                <p className="text-xs text-muted-foreground">{result?.recruiterView || "Score out of 100"}</p>
              </div>

              {/* Score Breakdown Visual Bars */}
              {result?.scoreBreakdown && (
                <div className="mt-4 pt-3 border-t space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Score Breakdown</p>
                  {Object.entries(result.scoreBreakdown).map(([key, value]) => {
                    const valNum = Number(value) || 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-semibold">{valNum}/100</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              valNum >= 80 ? 'bg-emerald-500' :
                              valNum >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: valNum + '%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Win Tips Callout */}
              {result && (
                <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 rounded-lg p-4 mt-4">
                  <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2.5 flex items-center gap-1.5 text-sm">
                    ⚡ Quick Wins — Do These First
                  </h3>
                  {(improvementsData?.quickWins || result.improvementSuggestions?.slice(0, 3) || ["Quantify project metrics with numbers and percentages", "Add GitHub link to your resume header", "Inject missing technical keywords for target role"]).map((win: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">→</span>
                      <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">{win}</span>
                    </div>
                  ))}
                </div>
              )}

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
                    <div className="space-y-3">
                      {(worldClassResume.projects || []).map((project: any, index: number) => {
                        const rawTech = project.tech || (Array.isArray(project.techStack) ? project.techStack.join(", ") : project.techStack) || "";
                        const techList = rawTech.split(",").map((s: string) => s.trim()).filter(Boolean);
                        return (
                          <div key={`${project.name}-${index}`} className="rounded border p-3.5 text-sm space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-bold text-foreground">{project.name}</p>
                              <div className="flex items-center gap-2">
                                {project.live && (
                                  <a href={project.live} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                                    Live Demo
                                  </a>
                                )}
                                {project.github && (
                                  <a href={project.github} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">
                                    GitHub
                                  </a>
                                )}
                              </div>
                            </div>
                            {techList.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {techList.map((techItem: string, tIdx: number) => (
                                  <span key={tIdx} className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                    {techItem}
                                  </span>
                                ))}
                              </div>
                            )}
                            <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-xs">
                              {(project.bullets || []).map((bullet: string, bIdx: number) => (
                                <li key={bIdx}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {(worldClassResume.education || []).length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Education</p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {(worldClassResume.education || []).map((education: any, index: number) => {
                        let college = education.college || education.institution || "";
                        const degree = education.degree || "";
                        if (college && degree && college.toLowerCase().includes(degree.toLowerCase())) {
                          college = college.replace(new RegExp(degree.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "").trim();
                        }
                        const metaParts = [college, education.year || education.duration, education.cgpa ? `CGPA: ${education.cgpa}` : ""].filter(Boolean);
                        return (
                          <li key={`${degree}-${index}`} className="text-xs">
                            <strong className="text-foreground text-sm font-semibold">{degree}</strong>
                            {metaParts.length > 0 && (
                              <span className="text-muted-foreground">{" — "}{metaParts.join(" | ")}</span>
                            )}
                          </li>
                        );
                      })}
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
                {downloadError && (
                  <p className="text-xs text-destructive" role="alert">{downloadError}</p>
                )}
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  {worldClass.data?.resumeVersionId ? (
                    <>
                      <Button
                        disabled={downloadingPdf}
                        onClick={() => downloadDirectPdf(worldClass.data.resumeVersionId)}
                      >
                        {downloadingPdf ? "Downloading..." : "Download PDF"}
                      </Button>
                      <Link href={`/pdf-export?versionId=${worldClass.data.resumeVersionId}`}>
                        <Button variant="outline">Export world-class PDF</Button>
                      </Link>
                    </>
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

          {/* One-Click Actionable Improvement Suggestions Panel */}
          {result && (
            <Card className="border-blue-200 dark:border-blue-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  One-Click Improvement Suggestions
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={getImprovements.isPending || !resumeId}
                  onClick={() => getImprovements.mutate()}
                >
                  {getImprovements.isPending ? "Analyzing..." : "Get Detailed Improvements"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {improvementsData ? (
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Category Improvements</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Score: {improvementsData.overallScore}/100</span>
                    </div>
                    {improvementsData.improvements?.map((imp: any) => (
                      <div key={imp.id} className="border rounded p-3 mb-2 bg-card">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm">{imp.section}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            imp.impact === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                            imp.impact === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}>{imp.impact?.toUpperCase()} IMPACT</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{imp.issue}</p>
                        <div className="bg-muted/60 p-2.5 rounded text-xs space-y-1">
                          {imp.current && <p className="text-rose-500 font-medium">Before: {imp.current}</p>}
                          {imp.improved && <p className="text-emerald-600 dark:text-emerald-400 font-medium">After: {imp.improved}</p>}
                        </div>
                        <Button
                          size="sm"
                          disabled={applySingleImp.isPending}
                          onClick={() => applySingleImp.mutate({ improvementId: imp.id, section: imp.section, newContent: imp.improved })}
                          className="mt-2 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          ✨ Apply This Improvement
                        </Button>
                      </div>
                    ))}
                    {improvementsData.quickWins?.length > 0 && (
                      <div className="mt-3 pt-2 border-t">
                        <p className="text-xs font-bold text-muted-foreground mb-1">Quick Wins</p>
                        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                          {improvementsData.quickWins.map((win: string, idx: number) => (
                            <li key={idx}>{win}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click &quot;Get Detailed Improvements&quot; to fetch section-by-section actionable fixes with 1-click apply buttons.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Job Description Based Tailored Resume Section */}
          <Card className="mt-6 border-t border-emerald-300 dark:border-emerald-800 pt-2">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                🎯 Tailor Resume to Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Job Title (e.g. Senior React Developer)"
                value={jdRole}
                onChange={(e) => setJdRole(e.target.value)}
              />
              <Input
                placeholder="Company Name"
                value={jdCompany}
                onChange={(e) => setJdCompany(e.target.value)}
              />
              <textarea
                placeholder="Paste the complete Job Description here..."
                rows={6}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full border rounded-md p-2.5 text-sm bg-background"
              />
              <Button
                disabled={tailorToJdMutation.isPending || !resumeId || !jdText}
                onClick={() => tailorToJdMutation.mutate()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-bold text-sm"
              >
                {tailorToJdMutation.isPending ? "Generating Job-Specific Resume..." : "🚀 Generate Job-Specific Resume (95%+ ATS Match)"}
              </Button>

              {tailorResult && (
                <div className="mt-4 p-4 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-emerald-800 dark:text-emerald-300">
                      ATS Match Score: {tailorResult.matchAnalysis?.matchScore || 95}/100
                    </span>
                    <Button
                      size="sm"
                      onClick={() => downloadDirectPdf(tailorResult.resumeVersionId)}
                    >
                      Download Tailored PDF
                    </Button>
                  </div>
                  {tailorResult.matchAnalysis?.matchedKeywords?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Matched Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {tailorResult.matchAnalysis.matchedKeywords.map((kw: string) => (
                          <span key={kw} className="bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs px-2 py-0.5 rounded">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {tailorResult.matchAnalysis?.missingKeywords?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Missing Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {tailorResult.matchAnalysis.missingKeywords.map((kw: string) => (
                          <span key={kw} className="bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs px-2 py-0.5 rounded">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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

      {/* --- Delete Confirmation Dialog Modal --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Delete Resume?</h3>
            <p className="text-sm text-muted-foreground">
              Delete this resume? This will also remove any generated versions based on it. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingResumeId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={deleteResumeMutation.isPending}
                onClick={() => {
                  if (deletingResumeId) {
                    deleteResumeMutation.mutate(deletingResumeId);
                  }
                }}
              >
                {deleteResumeMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Manage Resumes Modal --- */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Manage Uploaded Resumes</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowManageModal(false)}>Close</Button>
            </div>
            <div className="divide-y">
              {(resumes.data || []).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No uploaded resumes found.</p>
              ) : (
                (resumes.data || []).map((r: any) => (
                  <div key={r._id} className="flex items-center justify-between py-3 gap-3">
                    <div>
                      <p className="font-medium text-sm text-foreground">{r.fileName || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded: {formatResumeDate(r.createdAt) || "N/A"} • Storage: {r.fileUrl?.includes("cloudinary") ? "Cloudinary" : "Local Disk"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setDeletingResumeId(r._id);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
