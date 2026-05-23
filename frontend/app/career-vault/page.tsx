"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Briefcase, GraduationCap, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const ENTRY_TYPES = [
  { value: "experience", label: "Work experience", Icon: Briefcase },
  { value: "achievement", label: "Achievement", Icon: Award },
  { value: "education", label: "Education", Icon: GraduationCap },
  { value: "project", label: "Project", Icon: Briefcase },
  { value: "certification", label: "Certification", Icon: Award },
  { value: "skill", label: "Skill", Icon: Briefcase }
] as const;

function TypeIcon({ type }: { type: string }) {
  const found = ENTRY_TYPES.find((t) => t.value === type);
  if (!found) return null;
  const { Icon } = found;
  return <Icon className="h-4 w-4 text-primary" />;
}

export default function CareerVaultPage() {
  const qc = useQueryClient();
  const entries = useQuery({ queryKey: ["career-vault"], queryFn: () => api.get<any[]>("/career-vault"), retry: false });
  const create = useMutation({
    mutationFn: (data: FormData) => api.post("/career-vault", {
      type: data.get("type"),
      title: data.get("title"),
      organisation: data.get("organisation"),
      startDate: data.get("startDate") || undefined,
      endDate: data.get("endDate") || undefined,
      description: data.get("description"),
      impact: data.get("impact"),
      skills: (data.get("skills") as string || "").split(",").map((s) => s.trim()).filter(Boolean)
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["career-vault"] })
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/career-vault/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["career-vault"] })
  });

  const grouped = ENTRY_TYPES.reduce<Record<string, any[]>>((acc, t) => {
    acc[t.value] = (entries.data || []).filter((e: any) => e.type === t.value);
    return acc;
  }, {});

  return (
    <AppShell>
      <PageHeading
        title="Career vault"
        description="Your master record of work history, achievements, projects, certifications, and skills. Use this as the source of truth for every resume version."
      />
      <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Only add truthful entries. This vault feeds into resume generation and ATS analysis — accuracy is essential for building a reliable job-search profile.
      </div>

      {/* Add form */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" />Add career entry</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); (e.currentTarget as HTMLFormElement).reset(); }}
            className="grid gap-3 md:grid-cols-3"
          >
            <select name="type" aria-label="Entry type" className="rounded-md border bg-background px-3 py-2 text-sm" required>
              <option value="">Type</option>
              {ENTRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input name="title" placeholder="Title / role / award name" aria-label="Title" required className="md:col-span-2" />
            <Input name="organisation" placeholder="Organisation / company / institution" aria-label="Organisation" />
            <Input name="startDate" type="month" placeholder="Start" aria-label="Start date" />
            <Input name="endDate" type="month" placeholder="End (leave blank if current)" aria-label="End date" />
            <textarea
              name="description"
              placeholder="What did you do? (be specific and quantified)"
              aria-label="Description"
              className="md:col-span-3 min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Input name="impact" placeholder="Measurable impact (e.g. reduced load time by 40%)" aria-label="Impact" className="md:col-span-2" />
            <Input name="skills" placeholder="Skills used (comma-separated)" aria-label="Skills" />
            <Button type="submit" disabled={create.isPending} className="md:col-span-3">
              {create.isPending ? "Saving..." : "Save entry"}
            </Button>
          </form>
          {create.isError ? <p role="alert" className="mt-2 text-sm text-danger">{create.error instanceof Error ? create.error.message : "Could not save entry."}</p> : null}
        </CardContent>
      </Card>

      {entries.isLoading ? <LoadingState title="Loading career vault" description="Fetching your work history, achievements, and projects." /> : null}
      {entries.isError ? <ErrorState description={entries.error instanceof Error ? entries.error.message : "Could not load career vault."} action={<RetryButton onClick={() => entries.refetch()} />} /> : null}
      {!entries.isLoading && !entries.isError && !(entries.data || []).length ? (
        <EmptyState title="Career vault is empty" description="Add your work experience, achievements, projects, and certifications above. This becomes the source of truth for all your resume versions." />
      ) : null}

      {ENTRY_TYPES.map(({ value, label }) => {
        const group = grouped[value] || [];
        if (!group.length) return null;
        return (
          <div key={value} className="mb-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{label}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {group.map((item: any) => (
                <Card key={item._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-start justify-between gap-2 text-sm font-semibold">
                      <span className="flex items-center gap-2"><TypeIcon type={item.type} />{item.title}</span>
                      <Button variant="ghost" className="h-7 w-7 shrink-0 px-0" aria-label="Delete entry" onClick={() => remove.mutate(item._id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {item.organisation ? <p className="text-muted-foreground">{item.organisation}</p> : null}
                    {(item.startDate || item.endDate) ? <p className="text-xs text-muted-foreground">{item.startDate || ""}{item.startDate && item.endDate ? " – " : ""}{item.endDate || "Present"}</p> : null}
                    {item.description ? <p className="text-sm">{item.description}</p> : null}
                    {item.impact ? <p className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">Impact: {item.impact}</p> : null}
                    {(item.skills || []).length ? (
                      <div className="flex flex-wrap gap-1">
                        {(item.skills as string[]).map((s) => <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>)}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </AppShell>
  );
}
