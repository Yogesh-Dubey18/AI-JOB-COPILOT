"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Save,
  Link2,
  ExternalLink,
  Sparkles,
  User2,
  Building2,
  ShieldAlert,
  Info,
  ChevronRight,
  ListRestart,
  PlusCircle
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type QuestionType = {
  key: string;
  label: string;
  category: string;
};

const QUESTION_TYPES: QuestionType[] = [
  { key: "coverLetter", label: "Cover letter", category: "Application Materials" },
  { key: "hrEmail", label: "HR email", category: "Application Materials" },
  { key: "linkedinMessage", label: "LinkedIn message", category: "Application Materials" },
  { key: "whatsappMessage", label: "WhatsApp message", category: "Application Materials" },
  { key: "referralMessage", label: "Referral request", category: "Application Materials" },
  
  { key: "whyHireYouAnswer", label: "Why are you a good fit?", category: "Screening & Q&A" },
  { key: "whyCompanyAnswer", label: "Why this company?", category: "Screening & Q&A" },
  { key: "tellMeAboutYourselfAnswer", label: "Tell us about yourself", category: "Screening & Q&A" },
  { key: "salaryAnswer", label: "Salary expectation", category: "Screening & Q&A" },
  { key: "noticePeriodAnswer", label: "Notice period", category: "Screening & Q&A" },
  { key: "workAuthorizationAnswer", label: "Work authorization", category: "Screening & Q&A" },
  
  { key: "assignmentSubmissionAnswer", label: "Assignment submission", category: "Recruiter Follow-ups" },
  { key: "followUpMessageAnswer", label: "Follow-up message", category: "Recruiter Follow-ups" },
  { key: "rejectionResponseAnswer", label: "Rejection response", category: "Recruiter Follow-ups" },
  { key: "interviewConfirmationAnswer", label: "Interview confirmation", category: "Recruiter Follow-ups" }
];

const TONE_OPTIONS = [
  "Professional",
  "Fresher-friendly",
  "Technical",
  "Confident",
  "Polite follow-up",
  "Short recruiter DM",
  "Formal email"
];

function ApplyAssistantForm() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const prefillJobId = searchParams.get("jobId") ?? "";

  // Queries
  const appsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get<any[]>("/applications"),
    retry: false
  });

  const resumesQuery = useQuery({
    queryKey: ["resumes-versions"],
    queryFn: () => api.get<any[]>("/resumes/versions"),
    retry: false
  });

  const contactsQuery = useQuery({
    queryKey: ["contacts"],
    queryFn: () => api.get<any[]>("/contacts"),
    retry: false
  });

  const jobQuery = useQuery({
    queryKey: ["job", prefillJobId],
    queryFn: () => api.get<any>(`/jobs/${prefillJobId}`),
    enabled: !!prefillJobId,
    retry: false
  });

  // State
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("Professional");
  const [selectedQuestionKey, setSelectedQuestionKey] = useState<string>("whyHireYouAnswer");
  const [generatedKit, setGeneratedKit] = useState<any>(null);
  const [editableText, setEditableText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [vaultSaved, setVaultSaved] = useState<boolean>(false);
  const [timelineSaved, setTimelineSaved] = useState<boolean>(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [linkingStatus, setLinkingStatus] = useState<string>("");

  const applications = appsQuery.data || [];
  const resumeVersions = resumesQuery.data || [];
  const contacts = contactsQuery.data || [];

  const isPrefillInApps = useMemo(() => {
    if (!prefillJobId || !applications.length) return false;
    return applications.some((app: any) => String(app.jobId) === prefillJobId || String(app._id) === prefillJobId);
  }, [applications, prefillJobId]);

  const saveToTrackerMutation = useMutation({
    mutationFn: () => api.post(`/jobs/${prefillJobId}/save`),
    onSuccess: (res: any) => {
      toast.success("Job saved to tracker successfully!");
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save job to tracker.");
    }
  });

  const handleSaveToTracker = () => {
    saveToTrackerMutation.mutate();
  };

  // Mutations
  const generate = useMutation({
    mutationFn: (data: any) => api.post<any>("/ai/generate-application-kit", data),
    onSuccess: (data) => {
      setGeneratedKit(data);
      if (data) {
        const text = data[selectedQuestionKey] || "";
        setEditableText(text);
      }
      setVaultSaved(false);
      setTimelineSaved(false);
    }
  });

  const saveToVault = useMutation({
    mutationFn: (data: { question: string; answer: string; category?: string; tags?: string[] }) =>
      api.post("/answer-vault", data),
    onSuccess: () => {
      setVaultSaved(true);
      setTimeout(() => setVaultSaved(false), 3000);
    }
  });

  const updateApp = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      api.patch<any>(`/applications/${id}`, updates),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      // Keep selected app synced
      setLinkingStatus("Successfully linked recruiter contact!");
      setTimeout(() => setLinkingStatus(""), 4000);
    }
  });

  // Set initial selected application from prefillJobId
  useEffect(() => {
    if (prefillJobId && applications.length > 0) {
      const match = applications.find((a: any) => String(a.jobId) === prefillJobId || String(a._id) === prefillJobId);
      if (match) {
        setSelectedAppId(match._id);
        if (match.contactId) {
          setSelectedContactId(match.contactId);
        }
      }
    } else if (applications.length > 0 && !selectedAppId) {
      // Default to first application
      setSelectedAppId(applications[0]._id);
      if (applications[0].contactId) {
        setSelectedContactId(applications[0].contactId);
      }
    }
  }, [applications, prefillJobId]);

  // Set default resume version
  useEffect(() => {
    if (resumeVersions.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumeVersions[0]._id);
    }
  }, [resumeVersions]);

  // Sync selected contact when application selection changes
  useEffect(() => {
    if (selectedAppId && applications.length > 0) {
      const app = applications.find((a: any) => a._id === selectedAppId);
      if (app) {
        setSelectedContactId(app.contactId || "");
      }
    }
  }, [selectedAppId, applications]);

  // Update text when question type changes
  useEffect(() => {
    if (generatedKit) {
      const text = generatedKit[selectedQuestionKey] || "";
      setEditableText(text);
      setVaultSaved(false);
      setTimelineSaved(false);
    }
  }, [selectedQuestionKey, generatedKit]);

  const selectedApp = applications.find((a: any) => a._id === selectedAppId);
  const selectedContact = contacts.find((c: any) => c._id === selectedContactId);

  const handleGenerate = () => {
    if (!selectedResumeId) return;
    
    const payload: any = {
      resumeVersionId: selectedResumeId,
      tone: selectedTone
    };

    if (selectedApp) {
      if (selectedApp.jobId) {
        payload.jobId = selectedApp.jobId;
      } else {
        payload.job = {
          title: selectedApp.role,
          company: selectedApp.company,
          description: selectedApp.notes
        };
      }
    }

    generate.mutate(payload);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Could not copy text: ", err);
    }
  };

  const handleSaveToVault = () => {
    const qType = QUESTION_TYPES.find((q) => q.key === selectedQuestionKey);
    saveToVault.mutate({
      question: qType ? qType.label : selectedQuestionKey,
      answer: editableText,
      category: "Apply Assistant",
      tags: selectedApp ? [selectedApp.company, selectedApp.role] : ["Apply Assistant"]
    });
  };

  const handleSaveToTimeline = () => {
    if (!selectedApp) return;

    const qType = QUESTION_TYPES.find((q) => q.key === selectedQuestionKey);
    const label = qType ? qType.label : selectedQuestionKey;

    const newTimelineItem = {
      type: "note",
      title: `Draft Saved: ${label}`,
      message: `Saved customized draft (${selectedTone} tone) to application timeline:\n\n${editableText}`,
      createdAt: new Date().toISOString()
    };

    const updatedTimeline = [...(selectedApp.timeline || []), newTimelineItem];

    updateApp.mutate({
      id: selectedApp._id,
      updates: { timeline: updatedTimeline }
    });

    setTimelineSaved(true);
    setTimeout(() => setTimelineSaved(false), 3000);
  };

  const handleLinkContact = () => {
    if (!selectedAppId) return;
    updateApp.mutate({
      id: selectedAppId,
      updates: { contactId: selectedContactId || null }
    });
  };

  // Group question types by category
  const categories: Record<string, QuestionType[]> = QUESTION_TYPES.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, QuestionType[]>);

  return (
    <div className="space-y-6">
      {/* Safe apply assistant disclaimer */}
      <div className="flex flex-col gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200 md:flex-row md:items-start">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div className="space-y-1">
          <h4 className="font-bold">Manual Review Required (Safety Disclaimer)</h4>
          <p>
            This assistant generates personalized application drafts. <strong>It does not submit applications, send messages, or perform automated activities on your behalf.</strong> All draft messages, follow-ups, and negotiation templates must be copied, reviewed, and customized by you before use.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Setup Panel */}
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>1. Select application & resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Application Select */}
              <div className="space-y-1.5">
                <label htmlFor="application-select" className="text-xs font-semibold text-muted-foreground">Linked Application Tracker Card</label>
                {appsQuery.isLoading ? (
                  <div className="h-10 animate-pulse rounded bg-muted" />
                ) : (
                  <select
                    id="application-select"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                  >
                    <option value="">-- Select from Tracker --</option>
                    {applications.map((app: any) => (
                      <option key={app._id} value={app._id}>
                        {app.company} · {app.role} ({app.status})
                      </option>
                    ))}
                  </select>
                )}
                {applications.length === 0 && !appsQuery.isLoading && !prefillJobId && (
                  <p className="text-xs text-amber-600">No applications tracked yet. Add one in the application tracker.</p>
                )}
                {prefillJobId && jobQuery.data && !isPrefillInApps && (
                  <div className="rounded bg-violet-50 border border-violet-200 p-2.5 dark:bg-violet-950/20 dark:border-violet-900 flex flex-col gap-2 animate-fadeIn">
                    <p className="text-xs text-violet-850 dark:text-violet-200">
                      <strong>{jobQuery.data.company} · {jobQuery.data.title}</strong> is not saved in your tracker yet. Save it to start generating application templates.
                    </p>
                    <Button
                      type="button"
                      className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-[11px] h-7 w-fit self-end"
                      onClick={handleSaveToTracker}
                      disabled={saveToTrackerMutation.isPending}
                    >
                      <PlusCircle className="mr-1 h-3.5 w-3.5" />
                      {saveToTrackerMutation.isPending ? "Saving..." : "Save to Tracker"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Resume Select */}
              <div className="space-y-1.5">
                <label htmlFor="resume-select" className="text-xs font-semibold text-muted-foreground">Select Resume Version</label>
                {resumesQuery.isLoading ? (
                  <div className="h-10 animate-pulse rounded bg-muted" />
                ) : (
                  <select
                    id="resume-select"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                  >
                    <option value="">-- Select Resume Version --</option>
                    {resumeVersions.map((res: any) => (
                      <option key={res._id} value={res._id}>
                        {res.title} ({res.sourceType})
                      </option>
                    ))}
                  </select>
                )}
                {resumeVersions.length === 0 && !resumesQuery.isLoading && (
                  <p className="text-xs text-amber-600">No parsed resumes found. Upload a resume first.</p>
                )}
              </div>

              {/* Tone Select */}
              <div className="space-y-1.5">
                <label htmlFor="tone-select" className="text-xs font-semibold text-muted-foreground">Select Tone Mode</label>
                <select
                  id="tone-select"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleGenerate}
                disabled={generate.isPending || !selectedResumeId}
              >
                <Sparkles className="h-4 w-4" />
                {generate.isPending ? "Generating Drafts..." : "Generate Answers"}
              </Button>
            </CardContent>
          </Card>

          {/* CRM Recruiter Linking */}
          {selectedApp && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  CRM Recruiter Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded bg-muted/50 p-3 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Company: {selectedApp.company}</span>
                    <span>Role: {selectedApp.role}</span>
                  </div>
                </div>

                {/* Show currently linked contact */}
                {selectedApp.contact ? (
                  <div className="rounded border border-emerald-200 bg-emerald-50/50 p-3 text-xs space-y-2 dark:border-emerald-800 dark:bg-emerald-950/10">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">Linked Contact:</p>
                    <div className="flex items-center gap-1.5">
                      <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{selectedApp.contact.name} ({selectedApp.contact.role || "Recruiter"})</span>
                    </div>
                    {selectedApp.contact.email && (
                      <p className="text-muted-foreground">Email: {selectedApp.contact.email}</p>
                    )}
                    {selectedApp.contact.company && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{selectedApp.contact.company}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">
                    No recruiter contact linked to this application tracker card.
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="contact-select" className="text-xs font-semibold text-muted-foreground">Select Recruiter from CRM</label>
                  <select
                    id="contact-select"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                  >
                    <option value="">-- No Contact (Unlink) --</option>
                    {contacts.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleLinkContact}>
                    Link Recruiter
                  </Button>
                  <a href="/contacts" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" title="Add recruiter to list" className="px-3">
                      Add New Contact <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
                {linkingStatus && (
                  <p className="text-xs text-center text-emerald-600 font-semibold" role="status">
                    {linkingStatus}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Answers Synthesizer Panel */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid gap-5 md:grid-cols-[1fr_2fr]">
            {/* Question Selector List */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle>2. Select question</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-4">
                {Object.entries(categories).map(([category, questions]) => (
                  <div key={category} className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                      {category}
                    </h5>
                    <div className="flex flex-col gap-0.5">
                      {questions.map((q) => (
                        <button
                          key={q.key}
                          onClick={() => setSelectedQuestionKey(q.key)}
                          className={`flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-md transition ${
                            selectedQuestionKey === q.key
                              ? "bg-primary text-primary-foreground shadow"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <span>{q.label}</span>
                          <ChevronRight className="h-3 w-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Answer Display */}
            <div className="space-y-5">
              {generate.isError && (
                <Card className="border-danger/30 bg-danger/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-danger">Generation Error</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {generate.error instanceof Error ? generate.error.message : "Failed to generate application drafts."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings and metadata */}
              {generatedKit && (
                <div className="space-y-3">
                  {/* Fallback label */}
                  {generatedKit.isFallback && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                      <ListRestart className="h-4 w-4 text-amber-600" />
                      <span><strong>Fallback Template Mode:</strong> AI provider not configured. Deterministic base templates loaded.</span>
                    </div>
                  )}

                  {/* Answer Vault usage indicator */}
                  {generatedKit.usedSavedAnswers && (
                    <div className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>
                        <strong>Using your Answer Vault:</strong> {generatedKit.savedAnswersCount} saved answer
                        {generatedKit.savedAnswersCount === 1 ? "" : "s"} from your Answer Vault were referenced
                        while drafting these responses. Review each answer below to confirm it reflects your real
                        experience accurately.
                      </span>
                    </div>
                  )}

                  {/* Missing information warnings */}
                  {generatedKit.missingInfo && generatedKit.missingInfo.length > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-red-600" /> Missing Information Alerts:
                      </p>
                      <ul className="list-inside list-disc pl-1 space-y-0.5">
                        {generatedKit.missingInfo.map((info: string, idx: number) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills badges */}
                  {generatedKit.matchingSkills && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Matching skills used:</span>
                      {generatedKit.matchingSkills.map((s: string) => (
                        <Badge key={s} className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Main draft editor */}
              <Card className="flex-1">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      {QUESTION_TYPES.find((q) => q.key === selectedQuestionKey)?.label || "Draft Answer"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Tone: {selectedTone}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      title="Copy to clipboard"
                      variant="outline"
                      className="h-9 px-3"
                      onClick={handleCopy}
                      disabled={!editableText}
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </Button>

                    <Button
                      title="Save to Answer Vault"
                      variant="outline"
                      className="h-9 px-3"
                      onClick={handleSaveToVault}
                      disabled={!editableText || saveToVault.isPending}
                    >
                      <Save className="h-4 w-4" />
                      <span>{vaultSaved ? "Saved" : "Save Vault"}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    aria-label="Editable Answer Draft"
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    placeholder="Click 'Generate Answers' to synthesize personalized draft answers here."
                    rows={12}
                    className="font-mono text-sm leading-relaxed"
                  />

                  {/* Save to application timeline history */}
                  {selectedApp && (
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-xs text-muted-foreground">
                        Save this personalized draft to the application tracker timeline history.
                      </span>
                      <Button
                        variant="secondary"
                        onClick={handleSaveToTimeline}
                        disabled={!editableText || updateApp.isPending}
                      >
                        {timelineSaved ? "Logged!" : "Save to Application Timeline"}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 rounded-md bg-muted/60 p-3 text-[11px] text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>Disclaimer: Review before use. Make sure numbers, names, and custom experiences match your actual resume perfectly.</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplyAssistantPage() {
  return (
    <AppShell>
      <PageHeading
        title="AI apply assistant & answers synthesizer"
        description="Craft reviewed cover letters, follow-up messages, salary negotiations, and interview responses tailored to your target company and skills."
      />
      <Suspense
        fallback={
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading apply assistant workspace...
          </div>
        }
      >
        <ApplyAssistantForm />
      </Suspense>
    </AppShell>
  );
}
