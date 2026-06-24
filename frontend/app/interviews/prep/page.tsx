"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  DollarSign,
  Info,
  Mic2,
  Save,
  Sparkles,
  Target
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
type PrepMode = { id: string; label: string; icon: string };
type QuestionItem = { question: string; hint: string };
type StarDraft = { situation: string; task: string; action: string; result: string };

const EMPTY_STAR: StarDraft = { situation: "", task: "", action: "", result: "" };

// ────────────────────────────────────────────────────────────
// Main page component
// ────────────────────────────────────────────────────────────
export default function InterviewPrepPage() {
  const qc = useQueryClient();

  // UI state
  const [selectedMode, setSelectedMode] = useState("hr");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [starDraft, setStarDraft] = useState<StarDraft>(EMPTY_STAR);
  const [polishedAnswer, setPolishedAnswer] = useState("");
  const [copied, setCopied] = useState(false);
  const [vaultSaved, setVaultSaved] = useState(false);
  const [expandedHints, setExpandedHints] = useState<Record<string, boolean>>({});
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");

  // ── Queries ──────────────────────────────────────────────
  const modesQuery = useQuery({
    queryKey: ["interview-prep-modes"],
    queryFn: () => api.get<PrepMode[]>("/interviews/prep/modes"),
    retry: false
  });

  const questionBankQuery = useQuery({
    queryKey: ["interview-prep-qbank", selectedMode],
    queryFn: () => api.get<any>(`/interviews/prep/question-bank/${selectedMode}`),
    retry: false,
    enabled: Boolean(selectedMode)
  });

  const readinessQuery = useQuery({
    queryKey: ["interview-prep-readiness", selectedJobId, selectedAppId],
    queryFn: () =>
      api.get<any>(`/interviews/prep/readiness${selectedJobId ? `?jobId=${selectedJobId}` : selectedAppId ? `?applicationId=${selectedAppId}` : ""}`),
    retry: false
  });

  const contextQuery = useQuery({
    queryKey: ["interview-prep-context", selectedJobId, selectedAppId],
    queryFn: () =>
      api.get<any>(`/interviews/prep/context${selectedJobId ? `?jobId=${selectedJobId}` : selectedAppId ? `?applicationId=${selectedAppId}` : ""}`),
    retry: false
  });

  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get<any[]>("/applications"),
    retry: false
  });

  // ── Mutations ────────────────────────────────────────────
  const starMutation = useMutation({
    mutationFn: (input: { mode: string; question: string }) =>
      api.post<any>("/interviews/prep/star-template", input),
    onSuccess: (data) => {
      setStarDraft({
        situation: data.situation,
        task: data.task,
        action: data.action,
        result: data.result
      });
      setPolishedAnswer(data.polishedAnswer);
    }
  });

  const vaultMutation = useMutation({
    mutationFn: (input: { question: string; answer: string; mode: string }) =>
      api.post<any>("/interviews/prep/save-to-vault", input),
    onSuccess: () => {
      setVaultSaved(true);
      qc.invalidateQueries({ queryKey: ["answer-vault"] });
      setTimeout(() => setVaultSaved(false), 3000);
    }
  });

  // ── Handlers ─────────────────────────────────────────────
  function handleSelectQuestion(q: QuestionItem) {
    setSelectedQuestion(q);
    setStarDraft(EMPTY_STAR);
    setPolishedAnswer("");
    setVaultSaved(false);
    setCopied(false);
  }

  function handleGenerateTemplate() {
    if (!selectedQuestion) return;
    starMutation.mutate({ mode: selectedMode, question: selectedQuestion.question });
  }

  function buildPolishedFromDraft(): string {
    return [
      `Question: "${selectedQuestion?.question}"`,
      "",
      `Situation: ${starDraft.situation}`,
      `Task: ${starDraft.task}`,
      `Action: ${starDraft.action}`,
      `Result: ${starDraft.result}`,
      "",
      "DISCLAIMER: Review this answer carefully before your interview. Do not read it verbatim."
    ].join("\n");
  }

  async function handleCopy() {
    const text = polishedAnswer || buildPolishedFromDraft();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleSaveToVault() {
    if (!selectedQuestion) return;
    const answer = polishedAnswer || buildPolishedFromDraft();
    vaultMutation.mutate({ question: selectedQuestion.question, answer, mode: selectedMode });
  }

  const modes: PrepMode[] = modesQuery.data || [];
  const bank = questionBankQuery.data;
  const questions: QuestionItem[] = bank?.questions || [];
  const readiness = readinessQuery.data;
  const context = contextQuery.data;
  const applications = applicationsQuery.data || [];

  // ────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-normal md:text-3xl">Advanced interview preparation</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Select a prep mode, practice questions, build STAR answers, and track your readiness. All answers are reviewed by you before use.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:mt-1">
          <Link href="/answer-vault">
            <Button className="gap-2 font-semibold">
              <BookOpen className="h-4 w-4" /> Go to Answer Vault
            </Button>
          </Link>
          <Link href="/answer-vault?tab=salary">
            <Button variant="outline" className="gap-2 font-semibold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
              <DollarSign className="h-4 w-4" /> View Salary Negotiation Answers
            </Button>
          </Link>
        </div>
      </div>

      {/* Manual Review Warning */}
      <div
        role="alert"
        className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Manual Review Required.</strong> All templates and AI-generated answers are drafts.
            Review, edit, and personalise them with your real experience before any interview.
            This tool does not guarantee interview success.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* ── LEFT PANEL: Mode selector + Question bank ─── */}
        <div className="space-y-4">
          {/* Mode selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4" />
                Select Prep Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
              {modesQuery.isLoading && (
                <p className="text-xs text-muted-foreground">Loading modes…</p>
              )}
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  id={`mode-btn-${mode.id}`}
                  aria-pressed={selectedMode === mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    setSelectedQuestion(null);
                    setStarDraft(EMPTY_STAR);
                    setPolishedAnswer("");
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedMode === mode.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Application context selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Job / Application Context (optional)</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <select
                aria-label="Select Application"
                value={selectedAppId}
                onChange={(e) => { setSelectedAppId(e.target.value); setSelectedJobId(""); }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">No application selected</option>
                {applications.map((app: any) => (
                  <option key={app._id} value={app._id}>
                    {app.company} — {app.role || app.position || "Role"}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Voice note */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Mic2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">Voice mock interview</p>
                  <p className="mt-0.5">Voice mock interview is provider-ready / future enhancement.</p>
                  <p className="mt-0.5 text-primary">Text mock interview is available now.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────── */}
        <div className="space-y-5">

          {/* Readiness score */}
          {readiness && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Interview Readiness Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1"><Progress value={readiness.readinessScore} /></div>
                  <span className="min-w-[3.5rem] text-right text-sm font-bold">{readiness.readinessScore}/100</span>
                </div>
                <p className="text-sm font-medium">{readiness.readinessLevel}</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {(readiness.scores || []).map((s: any) => (
                    <div key={s.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                      {s.done
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        : <Info className="h-3.5 w-3.5 shrink-0" />}
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
                <p className="rounded-md bg-muted/60 p-2 text-[11px] text-muted-foreground">
                  {readiness.disclaimer}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Job/company context */}
          {context && (
            <Card className={context.hasContext ? "border-primary/30" : "border-dashed"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {context.hasContext ? `Context: ${context.job?.title} at ${context.job?.company}` : "Job Context"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!context.hasContext ? (
                  <p className="text-muted-foreground">{context.message}</p>
                ) : (
                  <>
                    {(context.job?.skills || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {context.job.skills.map((s: string) => (
                          <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                    {(context.suggestedTopics || []).length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Suggested preparation topics</p>
                        <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                          {context.suggestedTopics.map((t: string) => <li key={t}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                    {(context.salaryNotes || []).length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Salary discussion notes</p>
                        <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                          {context.salaryNotes.map((n: string) => <li key={n}>{n}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Question bank */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4" />
                Question Bank
                {bank?.isFallback && (
                  <span className="ml-auto rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    Fallback Template Mode
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {questionBankQuery.isLoading && (
                <p className="text-xs text-muted-foreground">Loading questions…</p>
              )}
              {questions.map((q) => (
                <div
                  key={q.question}
                  className={`rounded-md border p-3 text-sm cursor-pointer transition-colors ${
                    selectedQuestion?.question === q.question
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40 hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelectQuestion(q)}
                >
                  <p className="font-medium">{q.question}</p>
                  {expandedHints[q.question] && (
                    <p className="mt-1 text-xs text-muted-foreground">{q.hint}</p>
                  )}
                  <button
                    className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedHints((prev) => ({ ...prev, [q.question]: !prev[q.question] }));
                    }}
                  >
                    {expandedHints[q.question]
                      ? <><ChevronUp className="h-3 w-3" />Hide hint</>
                      : <><ChevronDown className="h-3 w-3" />Show hint</>}
                  </button>
                </div>
              ))}
              {bank?.disclaimer && (
                <p className="rounded-md bg-muted/60 p-2 text-[11px] text-muted-foreground">
                  {bank.disclaimer}
                </p>
              )}
            </CardContent>
          </Card>

          {/* STAR Answer Builder */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  STAR Answer Builder
                  {starMutation.data?.isFallback && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      Fallback Template Mode
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={handleGenerateTemplate}
                    disabled={!selectedQuestion || starMutation.isPending}
                  >
                    {starMutation.isPending ? "Generating…" : "Generate Template"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={handleCopy}
                    disabled={!starDraft.situation && !polishedAnswer}
                  >
                    {copied ? <><Check className="h-3.5 w-3.5 text-emerald-600" />Copied</> : <><ClipboardCopy className="h-3.5 w-3.5" />Copy</>}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={handleSaveToVault}
                    disabled={(!starDraft.situation && !polishedAnswer) || vaultMutation.isPending}
                  >
                    {vaultSaved
                      ? <><Check className="h-3.5 w-3.5 text-emerald-600" />Saved</>
                      : <><Save className="h-3.5 w-3.5" />Save to Vault</>}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedQuestion ? (
                <p className="text-sm text-muted-foreground">
                  Select a question from the Question Bank above, then click <strong>Generate Template</strong>.
                </p>
              ) : (
                <>
                  <p className="rounded-md bg-muted/60 p-2 text-sm font-medium">
                    {selectedQuestion.question}
                  </p>

                  {(["situation", "task", "action", "result"] as const).map((field) => (
                    <div key={field}>
                      <label
                        htmlFor={`star-${field}`}
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {field}
                      </label>
                      <Textarea
                        id={`star-${field}`}
                        aria-label={`STAR ${field}`}
                        value={starDraft[field]}
                        onChange={(e) => setStarDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                        placeholder={`Enter your ${field}…`}
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  ))}

                  <div>
                    <label
                      htmlFor="star-polished"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Final Polished Answer
                    </label>
                    <Textarea
                      id="star-polished"
                      aria-label="Final Polished Answer"
                      value={polishedAnswer}
                      onChange={(e) => setPolishedAnswer(e.target.value)}
                      placeholder="Your combined STAR answer will appear here after generating a template. Edit it into your own words."
                      rows={8}
                      className="font-mono text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 rounded-md bg-muted/60 p-3 text-[11px] text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Disclaimer: Review all answers before use. Fill in your real experience. Do not present templates verbatim.
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
