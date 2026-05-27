"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, CheckCircle2, Info, Sparkles, XCircle, AlertTriangle, ArrowRight,
  ExternalLink, FileText, Layers, RefreshCw, Trophy, BookOpenCheck, HelpCircle
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

const CURATED_FALLBACK_RESOURCES = [
  { topic: "JavaScript", resource: "MDN Web Docs (developer.mozilla.org)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  { topic: "React", resource: "React Documentation (react.dev)", url: "https://react.dev" },
  { topic: "Node.js", resource: "Node.js Documentation (nodejs.org)", url: "https://nodejs.org/en/docs" },
  { topic: "Express", resource: "ExpressJS Guide (expressjs.com)", url: "https://expressjs.com" },
  { topic: "MongoDB", resource: "MongoDB Official Manual (docs.mongodb.com)", url: "https://docs.mongodb.com/manual" },
  { topic: "SQL basics", resource: "W3Schools SQL Tutorial", url: "https://www.w3schools.com/sql" },
  { topic: "Git/GitHub", resource: "Pro Git Book (git-scm.com/book)", url: "https://git-scm.com/book/en/v2" },
  { topic: "Deployment", resource: "Render / Vercel / Netlify Quickstarts", url: "https://render.com/docs" },
  { topic: "DSA basics", resource: "NeetCode.io DSA Course", url: "https://neetcode.io" },
  { topic: "System design basics", resource: "System Design Primer by Donne Martin", url: "https://github.com/donnemartin/system-design-primer" },
  { topic: "HR/interview preparation", resource: "Tech Interview Handbook", url: "https://www.techinterviewhandbook.org" }
];

export default function SkillRoadmapPage() {
  const qc = useQueryClient();
  const [targetRole, setTargetRole] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  
  // Tab-like state for roadmap
  const [activePlanTab, setActivePlanTab] = useState<"7day" | "30day">("7day");
  
  // Checklist local tracking
  const [checked7Day, setChecked7Day] = useState<number[]>([]);
  const [checked30Day, setChecked30Day] = useState<number[]>([]);

  // Fetch resumes, applications, and existing learning plans
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => api.get<any[]>("/resumes"), retry: false });
  const applications = useQuery({ queryKey: ["applications"], queryFn: () => api.get<any[]>("/applications"), retry: false });
  const learningPlans = useQuery({ queryKey: ["learning-plans"], queryFn: () => api.get<any[]>("/ai/skill-gap/plans"), retry: false });

  const plans = learningPlans.data || [];
  const latestPlan = plans[0];

  // Auto-populate inputs based on selected values
  useEffect(() => {
    if (selectedResumeId && resumes.data) {
      const resume = resumes.data.find(r => r._id === selectedResumeId);
      if (resume?.parsedData?.skills) {
        setCurrentSkills(resume.parsedData.skills.join(", "));
      }
    }
  }, [selectedResumeId, resumes.data]);

  useEffect(() => {
    if (selectedJobId && applications.data) {
      const app = applications.data.find(a => a.jobId === selectedJobId || a._id === selectedJobId);
      if (app) {
        setTargetRole(app.role);
      }
    }
  }, [selectedJobId, applications.data]);

  // Load checked items from localStorage when a plan is loaded
  useEffect(() => {
    if (latestPlan) {
      const stored7 = localStorage.getItem(`checked_7_${latestPlan._id}`);
      const stored30 = localStorage.getItem(`checked_30_${latestPlan._id}`);
      if (stored7) setChecked7Day(JSON.parse(stored7));
      else setChecked7Day([]);
      if (stored30) setChecked30Day(JSON.parse(stored30));
      else setChecked30Day([]);
    }
  }, [latestPlan]);

  const analyze = useMutation({
    mutationFn: () => {
      const currentSkillsArr = currentSkills.split(",").map(s => s.trim()).filter(Boolean);
      return api.post<any>("/ai/skill-gap", {
        targetRole: targetRole.trim() || "Full Stack Developer",
        currentSkills: currentSkillsArr,
        resumeId: selectedResumeId || undefined,
        jobId: selectedJobId || undefined
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-plans"] });
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: (progress: number) => {
      if (!latestPlan) return Promise.reject("No plan loaded");
      return api.patch(`/ai/skill-gap/plans/${latestPlan._id}`, { progress });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-plans"] });
    }
  });

  const handleToggle7Day = (index: number) => {
    if (!latestPlan) return;
    const newChecked = checked7Day.includes(index)
      ? checked7Day.filter(i => i !== index)
      : [...checked7Day, index];
    setChecked7Day(newChecked);
    localStorage.setItem(`checked_7_${latestPlan._id}`, JSON.stringify(newChecked));
    
    // Calculate new overall progress
    const totalItems = (latestPlan.sevenDayPlan?.length || 0) + (latestPlan.thirtyDayPlan?.length || 0);
    if (totalItems > 0) {
      const progress = Math.round(((newChecked.length + checked30Day.length) / totalItems) * 100);
      updateProgressMutation.mutate(progress);
    }
  };

  const handleToggle30Day = (index: number) => {
    if (!latestPlan) return;
    const newChecked = checked30Day.includes(index)
      ? checked30Day.filter(i => i !== index)
      : [...checked30Day, index];
    setChecked30Day(newChecked);
    localStorage.setItem(`checked_30_${latestPlan._id}`, JSON.stringify(newChecked));

    // Calculate new overall progress
    const totalItems = (latestPlan.sevenDayPlan?.length || 0) + (latestPlan.thirtyDayPlan?.length || 0);
    if (totalItems > 0) {
      const progress = Math.round(((checked7Day.length + newChecked.length) / totalItems) * 100);
      updateProgressMutation.mutate(progress);
    }
  };

  const hasResumes = (resumes.data || []).length > 0;
  const hasJobs = (applications.data || []).length > 0;

  // Empty state if user has absolutely no data
  if (!resumes.isLoading && !applications.isLoading && !hasResumes && !hasJobs) {
    return (
      <AppShell>
        <PageHeading
          title="Skill gap roadmap"
          description="Identify missing skills and generate a dynamic learning checklist."
        />
        <Card className="border-dashed border-2 py-10 text-center max-w-2xl mx-auto mt-10">
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <HelpCircle className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-bold">No Resume or Job Data Found</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              To analyze skill gaps, the system requires a parsed resume or a selected job description. Please upload a resume or select matching roles first.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link href="/resume/upload">
                <Button className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" /> Upload base resume
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Layers className="h-4 w-4 mr-2" /> Browse & select jobs
                </Button>
              </Link>
              <Link href="/guided-workflow">
                <Button variant="ghost" className="w-full sm:w-auto">
                  Go to workflow
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const fallbackResources = latestPlan?.fallbackResources || [];

  return (
    <AppShell>
      <PageHeading
        title="Skill gap roadmap"
        description="Compare your current profile with a target job and generate structured 7-day and 30-day learning checklists with resources."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left Panel: Inputs & Target selection */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Setup analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resume selection */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select parsed resume
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  aria-label="Select parsed resume"
                >
                  <option value="">-- Manual input only --</option>
                  {(resumes.data || []).map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fileName} ({r.isBaseResume ? "Base" : "Version"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Job selection */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select saved job / application
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  aria-label="Select saved job"
                >
                  <option value="">-- Custom target role --</option>
                  {(applications.data || []).map((a) => (
                    <option key={a._id} value={a.jobId || a._id}>
                      {a.company} · {a.role} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              <hr className="my-2 border-muted" />

              {/* Custom Target Role */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target role
                </label>
                <Input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer, React Engineer"
                  aria-label="Target role input"
                />
              </div>

              {/* Custom Current Skills */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your current skills (comma-separated)
                </label>
                <Input
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  placeholder="e.g. JavaScript, React, HTML, CSS"
                  aria-label="Current skills input"
                />
              </div>

              <Button
                className="w-full"
                disabled={analyze.isPending || !targetRole.trim()}
                onClick={() => analyze.mutate()}
              >
                {analyze.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate roadmap
                  </>
                )}
              </Button>
              {analyze.isError ? (
                <p role="alert" className="text-xs text-danger mt-1">
                  {analyze.error instanceof Error ? analyze.error.message : "Could not analyze skill gap."}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Ethical Warning Banner */}
          <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/10">
            <CardContent className="p-4 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Ethical verification</p>
                <p className="text-xs text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                  <strong>Do not add skills to your resume unless you can explain them in an interview.</strong> Faking skills leads to quick technical assessment failure.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Gaps, Roadmaps & Curated Library */}
        <div className="space-y-6">
          {latestPlan ? (
            <>
              {/* Dynamic Overall Progress Card */}
              <Card className="border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/60 dark:bg-emerald-950/5">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                      <Trophy className="h-4 w-4 text-emerald-600" />
                      Learning plan progress for {latestPlan.targetRole}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Check off items in the roadmaps below to update your completion score.
                    </p>
                    <div className="h-2.5 mt-2">
                      <Progress value={latestPlan.progress || 0} />
                    </div>
                  </div>
                  <div className="text-center md:text-right shrink-0">
                    <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                      {latestPlan.progress || 0}%
                    </span>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">
                      Tasks Completed
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Analysis breakdown */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Missing Skills list */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-danger flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" /> Missing skills (gaps)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(latestPlan.missingSkills || []).map((s: string) => (
                        <span key={s} className="rounded bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 px-2 py-0.5 text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="rounded border bg-muted/30 p-2.5 text-[11px] text-muted-foreground leading-normal">
                      <p className="font-semibold text-foreground mb-1">ATS Optimization advice:</p>
                      Suggest where a missing skill could be added <strong>only if you actually know it</strong>. Warning against fake skills is strictly enforced.
                    </div>
                  </CardContent>
                </Card>

                {/* Priority / weak / interview critical skills */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Priority focus & interview prep
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(latestPlan.prioritySkills || []).map((s: string) => (
                        <span key={s} className="rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 px-2 py-0.5 text-xs font-medium">
                          {s} (Priority)
                        </span>
                      ))}
                    </div>
                    <div>
                      <Link href="/interviews/prep?mode=technical">
                        <Button variant="outline" className="w-full text-xs">
                          Practice interview questions <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Roadmaps tab-style checklists */}
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpenCheck className="h-4 w-4 text-primary" /> Roadmap Checklists
                    </CardTitle>
                    <div className="flex gap-1.5 bg-muted p-1 rounded-md text-xs">
                      <button
                        onClick={() => setActivePlanTab("7day")}
                        className={`px-3 py-1 rounded font-medium transition ${
                          activePlanTab === "7day"
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        7-day revision sprint
                      </button>
                      <button
                        onClick={() => setActivePlanTab("30day")}
                        className={`px-3 py-1 rounded font-medium transition ${
                          activePlanTab === "30day"
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        30-day curriculum
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {activePlanTab === "7day" ? (
                    <div className="divide-y">
                      {(latestPlan.sevenDayPlan || []).map((task: string, i: number) => {
                        const isChecked = checked7Day.includes(i);
                        return (
                          <div
                            key={i}
                            onClick={() => handleToggle7Day(i)}
                            className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Task: ${task}`}
                            />
                            <span className={isChecked ? "line-through text-muted-foreground" : "text-foreground"}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {(latestPlan.thirtyDayPlan || []).map((task: string, i: number) => {
                        const isChecked = checked30Day.includes(i);
                        return (
                          <div
                            key={i}
                            onClick={() => handleToggle30Day(i)}
                            className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Task: ${task}`}
                            />
                            <span className={isChecked ? "line-through text-muted-foreground" : "text-foreground"}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Project suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" /> Recommended project ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {(latestPlan.projectSuggestions || []).map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <p>No roadmap generated yet. Select your target role and click "Generate roadmap" on the left panel to begin.</p>
            </Card>
          )}

          {/* Curated fallback resources library */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" /> Reference resource library
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Curated fallback resources — external course provider is not connected. Do not fake paid/course API integrations.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {fallbackResources.length > 0
                  ? fallbackResources.map((res: any, idx: number) => (
                      <a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border p-3 flex justify-between items-start hover:bg-muted/40 transition group"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">
                            {res.topic}
                          </span>
                          <p className="text-xs font-semibold text-foreground">{res.resource}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition shrink-0 mt-0.5" />
                      </a>
                    ))
                  : CURATED_FALLBACK_RESOURCES.map((res: any, idx: number) => (
                      <a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border p-3 flex justify-between items-start hover:bg-muted/40 transition group"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">
                            {res.topic}
                          </span>
                          <p className="text-xs font-semibold text-foreground">{res.resource}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition shrink-0 mt-0.5" />
                      </a>
                    ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
