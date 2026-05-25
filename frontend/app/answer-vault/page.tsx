"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Copy, Plus, Tag, Trash2, Check, Sparkles, DollarSign, Briefcase } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const CATEGORIES = ["HR", "Behavioral", "Technical", "Salary", "Situational", "Company-specific"];

const PREDEFINED_TEMPLATES = [
  {
    id: "self-intro",
    title: "Tell me about yourself (STAR format)",
    category: "Behavioral",
    text: "I am a [Target Role] with [Years] years of experience. In my previous role at [Previous Company], I led the development of [Key Project], which improved [Metric/Performance] by [Value]. I specialize in [Skills]. I'm excited about this role at [Company Name] because of your focus on [Company Value/Product].",
    placeholders: ["[Target Role]", "[Years]", "[Previous Company]", "[Key Project]", "[Metric/Performance]", "[Value]", "[Skills]", "[Company Name]", "[Company Value/Product]"]
  },
  {
    id: "why-company",
    title: "Why do you want to work here?",
    category: "Behavioral",
    text: "I've been following [Company Name] and am really impressed by [Specific Project/Achievement]. Given my background in [Your Skill], I see a clear opportunity to contribute to your goals for [Target Goal]. Furthermore, the company culture around [Culture Value] aligns perfectly with my professional style.",
    placeholders: ["[Company Name]", "[Specific Project/Achievement]", "[Your Skill]", "[Target Goal]", "[Culture Value]"]
  },
  {
    id: "salary-initial",
    title: "Initial Salary Question Response",
    category: "Salary",
    text: "Based on my research of similar [Target Role] roles in [Location] and the value I bring with my skills in [Core Skill], I'm looking for a total compensation package in the range of [Salary Min] to [Salary Max]. However, I am open to discussing the complete offer including equity and benefits.",
    placeholders: ["[Target Role]", "[Location]", "[Core Skill]", "[Salary Min]", "[Salary Max]"]
  },
  {
    id: "salary-counter",
    title: "Salary Counter-Offer Email/Script",
    category: "Salary",
    text: "Thank you so much for the offer! I am thrilled about the opportunity to join [Company Name] as a [Target Role]. Given my [Years] years of experience and specialization in [Core Skill], which will allow me to immediately contribute to [Specific Project], I was hoping we could explore a base salary closer to [Counter Salary]. Let me know if we can discuss this.",
    placeholders: ["[Company Name]", "[Target Role]", "[Years]", "[Core Skill]", "[Specific Project]", "[Counter Salary]"]
  },
  {
    id: "signing-bonus",
    title: "Requesting a Signing Bonus",
    category: "Salary",
    text: "I really appreciate the offer for the [Target Role] position at [Company Name]. I'm eager to sign, but I have a competing offer or pending bonus from my current company. If you could offer a signing bonus of [Bonus Amount] to help bridge this gap, I would be happy to accept the offer immediately.",
    placeholders: ["[Target Role]", "[Company Name]", "[Bonus Amount]"]
  }
];

export default function AnswerVaultPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"vault" | "templates">("vault");
  const [filter, setFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

  // Placeholders state
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({
    "[Target Role]": "Full Stack Developer",
    "[Years]": "3",
    "[Previous Company]": "Acme Corp",
    "[Key Project]": "real-time dashboard scaling",
    "[Metric/Performance]": "load times",
    "[Value]": "40%",
    "[Skills]": "React, Node.js, and MongoDB",
    "[Company Name]": "Stripe",
    "[Company Value/Product]": "developer-first API design",
    "[Specific Project/Achievement]": "their new billing infrastructure",
    "[Your Skill]": "payment systems integration",
    "[Target Goal]": "scaling European operations",
    "[Culture Value]": "transparency and autonomy",
    "[Location]": "San Francisco",
    "[Core Skill]": "system architecture",
    "[Salary Min]": "$130,000",
    "[Salary Max]": "$160,000",
    "[Counter Salary]": "$145,000",
    "[Bonus Amount]": "$15,000",
    "[Specific Project]": "the subscription service migration"
  });

  const answers = useQuery({ queryKey: ["answer-vault"], queryFn: () => api.get<any[]>("/answer-vault"), retry: false });
  
  const create = useMutation({
    mutationFn: (data: any) => api.post("/answer-vault", data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["answer-vault"] }); 
    }
  });

  const createFormMutation = useMutation({
    mutationFn: (data: FormData) => api.post("/answer-vault", {
      question: data.get("question"),
      answer: data.get("answer"),
      category: data.get("category"),
      tags: (data.get("tags") as string || "").split(",").map((t) => t.trim()).filter(Boolean)
    }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["answer-vault"] }); 
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/answer-vault/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["answer-vault"] })
  });

  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues((prev) => ({ ...prev, [key]: value }));
  };

  const getCustomizedText = (text: string) => {
    let result = text;
    Object.entries(placeholderValues).forEach(([key, val]) => {
      result = result.replaceAll(key, val || key);
    });
    return result;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplateToVault = async (template: typeof PREDEFINED_TEMPLATES[0]) => {
    const customizedText = getCustomizedText(template.text);
    setSavedTemplateId(template.id);
    try {
      await create.mutateAsync({
        question: template.title,
        answer: customizedText,
        category: template.category,
        tags: ["predefined-template"]
      });
      setTimeout(() => {
        setSavedTemplateId(null);
        setActiveTab("vault");
      }, 1000);
    } catch (e) {
      setSavedTemplateId(null);
    }
  };

  const filtered = (answers.data || []).filter((a: any) =>
    !filter || a.question?.toLowerCase().includes(filter.toLowerCase()) || a.category?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AppShell>
      <PageHeading
        title="Answer vault & templates"
        description="Save, customise, and reuse your best interview answers. Build your personal bank of HR, behavioral, technical, and salary negotiation responses."
      />

      {/* Tabs */}
      <div className="mb-6 flex border-b border-muted">
        <button
          onClick={() => setActiveTab("vault")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "vault"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Saved Answers
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "templates"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Negotiation & Behavioral Templates
        </button>
      </div>

      {activeTab === "vault" ? (
        <>
          <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            Only save answers you have practised and can deliver naturally in an interview. Review every answer before reusing it for a different company or role.
          </div>

          {/* Add form */}
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" />Add custom answer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createFormMutation.mutate(new FormData(e.currentTarget));
                  (e.currentTarget as HTMLFormElement).reset();
                }}
                className="grid gap-3 md:grid-cols-2"
              >
                <Input name="question" placeholder="Interview question" aria-label="Interview question" required className="md:col-span-2" />
                <textarea
                  name="answer"
                  placeholder="Your best answer (STAR format for behavioral questions)"
                  aria-label="Your answer"
                  className="md:col-span-2 min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <select name="category" aria-label="Category" className="rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input name="tags" placeholder="Tags (comma-separated: e.g. leadership, conflict)" aria-label="Tags" />
                <Button type="submit" disabled={createFormMutation.isPending} className="md:col-span-2">
                  {createFormMutation.isPending ? "Saving..." : "Save answer"}
                </Button>
              </form>
              {createFormMutation.isError ? (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {createFormMutation.error instanceof Error ? createFormMutation.error.message : "Could not save answer."}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Filter */}
          <div className="mb-4 flex gap-2">
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search questions or categories..." aria-label="Filter answers" className="max-w-sm" />
            {filter ? <Button variant="ghost" onClick={() => setFilter("")}>Clear</Button> : null}
          </div>

          {answers.isLoading ? <LoadingState title="Loading answer vault" description="Fetching your saved interview answers." /> : null}
          {answers.isError ? <ErrorState description={answers.error instanceof Error ? answers.error.message : "Could not load answers."} action={<RetryButton onClick={() => answers.refetch()} />} /> : null}
          {!answers.isLoading && !answers.isError && !filtered.length ? (
            <EmptyState title="No answers saved yet" description="Add your first answer above. Build up your personal vault of HR, behavioral, technical, and salary responses." />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((item: any) => (
              <Card key={item._id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between gap-2 text-sm font-semibold">
                    <span className="flex items-start gap-2">
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item.question}
                    </span>
                    <Button variant="ghost" className="h-7 w-7 shrink-0 px-0" aria-label="Delete answer" onClick={() => remove.mutate(item._id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.answer}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.category ? <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.category}</span> : null}
                    {(item.tags || []).map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                    <Button
                      variant="ghost"
                      className="ml-auto h-7 px-2 text-xs"
                      onClick={() => handleCopy(item._id, item.answer)}
                      aria-label="Copy answer"
                    >
                      {copiedId === item._id ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-green-600 animate-pulse" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Placeholder Customizer */}
          <Card className="mb-6 border-violet-200 dark:border-violet-900 bg-violet-50/20 dark:bg-violet-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Customize Placeholders
              </CardTitle>
              <p className="text-xs text-muted-foreground">Updating these values automatically updates all templates below in real-time.</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Object.keys(placeholderValues).map((placeholder) => {
                  let Icon = Briefcase;
                  if (placeholder.toLowerCase().includes("salary") || placeholder.toLowerCase().includes("bonus") || placeholder.toLowerCase().includes("amount") || placeholder.toLowerCase().includes("min") || placeholder.toLowerCase().includes("max")) {
                    Icon = DollarSign;
                  }
                  return (
                    <div key={placeholder} className="space-y-1">
                      <label className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">{placeholder}</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-muted-foreground">
                          <Icon className="h-3 w-3" />
                        </span>
                        <Input
                          value={placeholderValues[placeholder]}
                          onChange={(e) => handlePlaceholderChange(placeholder, e.target.value)}
                          className="h-8 pl-7 text-xs"
                          placeholder={placeholder}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Predefined templates grouped by category */}
          <div className="space-y-6">
            {["Behavioral", "Salary"].map((cat) => {
              const items = PREDEFINED_TEMPLATES.filter((t) => t.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {cat === "Salary" ? <DollarSign className="h-4 w-4 text-emerald-600" /> : <Briefcase className="h-4 w-4 text-blue-600" />}
                    {cat} Templates
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {items.map((template) => {
                      const customizedText = getCustomizedText(template.text);
                      return (
                        <Card key={template.id} className="border-muted hover:border-violet-200 transition-all flex flex-col justify-between">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
                              {template.title}
                              <span className="rounded bg-violet-100 dark:bg-violet-950/60 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                                {template.category}
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                            <div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground font-mono whitespace-pre-wrap flex-1">
                              {customizedText}
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                className="h-8 px-2.5 text-xs"
                                onClick={() => handleCopy(template.id, customizedText)}
                                aria-label={`Copy ${template.title}`}
                              >
                                {copiedId === template.id ? (
                                  <>
                                    <Check className="mr-1 h-3.5 w-3.5 text-green-600" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-1 h-3.5 w-3.5" />
                                    Copy
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="primary"
                                className="h-8 px-2.5 text-xs"
                                onClick={() => handleSaveTemplateToVault(template)}
                                disabled={savedTemplateId === template.id}
                                aria-label={`Save ${template.title} to vault`}
                              >
                                {savedTemplateId === template.id ? (
                                  <>
                                    <Check className="mr-1 h-3.5 w-3.5 text-white animate-pulse" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                    Save to Vault
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
