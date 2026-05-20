"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const apps = useQuery({ queryKey: ["applications"], queryFn: () => api.get<any[]>("/applications"), retry: false });
  const insights = useQuery({ queryKey: ["application-insights"], queryFn: () => api.get<any>("/applications/insights"), retry: false });
  const create = useMutation({ mutationFn: (data: FormData) => api.post("/applications", { company: data.get("company"), role: data.get("role"), status: "Applied", applicationSource: data.get("source") }), onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }) });
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
            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <Input name="company" placeholder="Company" />
            <Input name="role" placeholder="Role" />
            <Input name="source" placeholder="Source" />
            <Button><Plus className="h-4 w-4" /> Add</Button>
          </form>
        </CardContent>
      </Card>
      <KanbanBoard applications={apps.data || []} />
    </AppShell>
  );
}
