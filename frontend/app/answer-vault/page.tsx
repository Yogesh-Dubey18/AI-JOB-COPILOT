"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Copy, Plus, Tag, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const CATEGORIES = ["HR", "Behavioral", "Technical", "Salary", "Situational", "Company-specific"];

export default function AnswerVaultPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const answers = useQuery({ queryKey: ["answer-vault"], queryFn: () => api.get<any[]>("/answer-vault"), retry: false });
  const create = useMutation({
    mutationFn: (data: FormData) => api.post("/answer-vault", {
      question: data.get("question"),
      answer: data.get("answer"),
      category: data.get("category"),
      tags: (data.get("tags") as string || "").split(",").map((t) => t.trim()).filter(Boolean)
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["answer-vault"] }); }
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/answer-vault/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["answer-vault"] })
  });

  const filtered = (answers.data || []).filter((a: any) =>
    !filter || a.question?.toLowerCase().includes(filter.toLowerCase()) || a.category?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AppShell>
      <PageHeading
        title="Answer vault"
        description="Save, categorise, and reuse your best interview answers. Build your personal bank of HR, behavioral, technical, and salary negotiation responses."
      />
      <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Only save answers you have practised and can deliver naturally in an interview. Review every answer before reusing it for a different company or role.
      </div>

      {/* Add form */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" />Add answer</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); (e.currentTarget as HTMLFormElement).reset(); }}
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
            <Button type="submit" disabled={create.isPending} className="md:col-span-2">
              {create.isPending ? "Saving..." : "Save answer"}
            </Button>
          </form>
          {create.isError ? <p role="alert" className="mt-2 text-sm text-danger">{create.error instanceof Error ? create.error.message : "Could not save answer."}</p> : null}
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
                <span className="flex items-start gap-2"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item.question}</span>
                <Button variant="ghost" className="h-7 w-7 shrink-0 px-0" aria-label="Delete answer" onClick={() => remove.mutate(item._id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.answer}</p>
              <div className="flex flex-wrap items-center gap-2">
                {item.category ? <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.category}</span> : null}
                {(item.tags || []).map((tag: string) => <span key={tag} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"><Tag className="h-3 w-3" />{tag}</span>)}
                <Button
                  variant="ghost"
                  className="ml-auto h-7 px-2 text-xs"
                  onClick={() => navigator.clipboard.writeText(item.answer)}
                  aria-label="Copy answer"
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
