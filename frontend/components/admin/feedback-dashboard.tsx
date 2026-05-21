"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ClipboardList, GitPullRequestDraft, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";

type AdminFeedback = {
  summary: { total: number; open: number; highPriority: number; averageRating: number; byType: Record<string, number> };
  items: Array<{ _id: string; type: string; rating?: number; message: string; page?: string; status: string; priority: string; issueTitle?: string; issueLabels?: string[]; createdAt?: string }>;
  issueQueue: Array<{ id: string; title: string; labels: string[]; priority: string; status: string }>;
};

export function FeedbackDashboard() {
  const [draft, setDraft] = useState<{ title: string; labels: string[]; body: string } | null>(null);
  const query = useQuery({ queryKey: ["admin-feedback"], queryFn: () => api.get<AdminFeedback>("/admin/feedback"), retry: false });
  const triage = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch<any>(`/admin/feedback/${id}`, { status }),
    onSuccess: () => query.refetch()
  });
  const issueDraft = useMutation({
    mutationFn: (id: string) => api.post<{ title: string; labels: string[]; body: string }>(`/admin/feedback/${id}/issue-draft`),
    onSuccess: (data) => setDraft(data)
  });
  const summary = query.data?.summary;

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Feedback operations</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">Triage real user feedback, draft issues, and keep product improvements tied to releases.</p>
        </div>
        <Button variant="outline" onClick={() => query.refetch()}><RefreshCcw className="h-4 w-4" /> Refresh</Button>
      </div>
      {query.isLoading ? <LoadingState title="Loading feedback" description="Gathering user notes and triage queue." /> : null}
      {query.isError ? <ErrorState description={query.error instanceof Error ? query.error.message : "Could not load feedback."} action={<RetryButton onClick={() => query.refetch()} />} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total", summary?.total || 0],
          ["Open", summary?.open || 0],
          ["High priority", summary?.highPriority || 0],
          ["Average rating", summary?.averageRating || 0]
        ].map(([label, value]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Inbox</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!query.isLoading && !query.isError && !(query.data?.items || []).length ? <EmptyState title="No feedback yet" description="Feedback submitted by users will appear here for triage." /> : null}
            {(query.data?.items || []).map((item) => (
              <div key={item._id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{item.type}</Badge>
                  <Badge>{item.status}</Badge>
                  <Badge>{item.priority}</Badge>
                  {item.rating ? <Badge>{item.rating}/5</Badge> : null}
                </div>
                <p className="mt-2 text-sm">{item.message}</p>
                {item.page ? <p className="mt-1 text-xs text-muted-foreground">{item.page}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => triage.mutate({ id: item._id, status: "in_review" })}>Review</Button>
                  <Button type="button" variant="outline" onClick={() => triage.mutate({ id: item._id, status: "resolved" })}>Resolve</Button>
                  <Button type="button" variant="secondary" onClick={() => issueDraft.mutate(item._id)}><GitPullRequestDraft className="h-4 w-4" /> Issue draft</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Issue queue</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(query.data?.issueQueue || []).map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">{item.labels.map((label) => <Badge key={label}>{label}</Badge>)}</div>
              </div>
            ))}
            {draft ? <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs" aria-label="Issue draft">{JSON.stringify(draft, null, 2)}</pre> : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
