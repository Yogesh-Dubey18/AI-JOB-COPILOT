"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const apps = useQuery({ queryKey: ["applications"], queryFn: () => api.get<any[]>("/applications"), retry: false });
  const insights = useQuery({ queryKey: ["application-insights"], queryFn: () => api.get<any>("/applications/insights"), retry: false });
  const create = useMutation({ mutationFn: (data: FormData) => api.post("/applications", { company: data.get("company"), role: data.get("role"), jobTitle: data.get("jobTitle"), status: "Applied", applicationSource: data.get("source"), recruiterName: data.get("recruiterName"), followUpDate: data.get("followUpDate") || undefined }), onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }) });
  const summary = insights.data || {};
  return (
    <AppShell>
      <PageHeading title="Application tracker" description="Track every role across saved, applied, rounds, offer, selected, rejected, and withdrawn stages in Kanban or table form." />
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {[
          ["Active", summary.active || 0],
          ["Follow-ups due", summary.followUpsDue || 0],
          ["Interviews", summary.interviews || 0],
          ["Response rate", `${summary.responseRate || 0}%`]
        ].map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>)}
      </div>
      {(summary.nextActions || []).length ? (
        <Card className="mb-5">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> Priority follow-ups</CardTitle></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {summary.nextActions.map((item: any) => <div key={item.applicationId} className="rounded-md border p-3 text-sm"><p className="font-semibold">{item.role} at {item.company}</p><p className="mt-1 flex items-center gap-1 text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> {item.status} - priority {item.priorityScore}</p></div>)}
          </CardContent>
        </Card>
      ) : null}
      <Card className="mb-5">
        <CardHeader><CardTitle>Add manual application</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate(new FormData(event.currentTarget));
            }}
            className="grid gap-3 md:grid-cols-3"
          >
            <Input aria-label="Company name" name="company" placeholder="Company" required />
            <Input aria-label="Job title" name="jobTitle" placeholder="Job title" />
            <Input aria-label="Role / dept" name="role" placeholder="Role / dept" required />
            <Input aria-label="Application source" name="source" placeholder="Source (LinkedIn, referral...)" />
            <Input aria-label="Recruiter name" name="recruiterName" placeholder="Recruiter name (optional)" />
            <Input aria-label="Follow-up date" name="followUpDate" type="date" placeholder="Follow-up date" />
            <Button type="submit" disabled={create.isPending} aria-busy={create.isPending} className="md:col-span-1"><Plus className="h-4 w-4" /> {create.isPending ? "Adding..." : "Add"}</Button>
          </form>
          {create.isError ? <p role="alert" className="mt-3 text-sm text-danger">{create.error instanceof Error ? create.error.message : "Could not add application."}</p> : null}
        </CardContent>
      </Card>
      {apps.isLoading ? <LoadingState title="Loading application pipeline" description="Preparing the Kanban stages, follow-up signals, and current rounds." /> : null}
      {apps.isError ? <ErrorState description={apps.error instanceof Error ? apps.error.message : "Could not load applications."} action={<RetryButton onClick={() => apps.refetch()} />} /> : null}
      {!apps.isLoading && !apps.isError && !(apps.data || []).length ? (
        <EmptyState title="No applications tracked yet" description="Add your first manual application above, then move it through the pipeline as recruiters respond." />
      ) : null}
      {!apps.isLoading && !apps.isError ? <KanbanBoard applications={apps.data || []} /> : null}
    </AppShell>
  );
}
