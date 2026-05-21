"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function InterviewHistoryPage() {
  const history = useQuery({ queryKey: ["interview-history"], queryFn: () => api.get<any>("/interviews/history"), retry: false });
  const sessions = history.data?.sessions || [];
  const mocks = history.data?.mocks || [];
  const interviews = history.data?.interviews || [];
  return (
    <AppShell>
      <PageHeading title="Interview history" description="Review coach sessions, mock interviews, scheduled rounds, scores, feedback, and next practice focus." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Coach sessions</CardTitle></CardHeader><CardContent className="space-y-3">{sessions.length ? sessions.map((item: any) => <div key={item._id} className="rounded-md border p-3 text-sm"><div className="flex justify-between gap-2"><span className="font-semibold">{item.role}</span><Badge>{item.status}</Badge></div><p className="text-muted-foreground">{item.focus} - {item.readinessScore || 0}/100</p></div>) : <p className="text-sm text-muted-foreground">No coach sessions yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Mock interviews</CardTitle></CardHeader><CardContent className="space-y-3">{mocks.length ? mocks.map((item: any) => <div key={item._id} className="rounded-md border p-3 text-sm"><div className="font-semibold">{item.role}</div><p className="text-muted-foreground">{item.status}</p></div>) : <p className="text-sm text-muted-foreground">No mock interviews yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Scheduled rounds</CardTitle></CardHeader><CardContent className="space-y-3">{interviews.length ? interviews.map((item: any) => <div key={item._id} className="rounded-md border p-3 text-sm"><div className="font-semibold">{item.roundType}</div><p className="text-muted-foreground">{item.mode} {item.result ? "- " + item.result : ""}</p></div>) : <p className="text-sm text-muted-foreground">No scheduled rounds yet.</p>}</CardContent></Card>
      </div>
    </AppShell>
  );
}
