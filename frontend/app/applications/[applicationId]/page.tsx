"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export default function ApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const app = useQuery({ queryKey: ["application", params.applicationId], queryFn: () => api.get<any>("/applications/" + params.applicationId), retry: false });
  const rejection = useMutation({ mutationFn: (data: FormData) => api.post<any>("/ai/rejection-analysis", { applicationId: params.applicationId, rejectionReason: data.get("reason") }) });
  return (
    <AppShell>
      <PageHeading title={app.data?.role || "Application detail"} description={app.data?.company || "Timeline, resume used, kit used, notes, interviews, follow-ups, rejection analysis, and offer details."} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent><pre className="rounded-md bg-muted p-4 text-xs">{JSON.stringify(app.data || {}, null, 2)}</pre></CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Rejection analysis</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                rejection.mutate(new FormData(event.currentTarget));
              }}
              className="space-y-3"
            >
              <Textarea name="reason" placeholder="Paste rejection reason or notes" />
              <Button>Analyze rejection</Button>
            </form>
            <pre className="mt-3 rounded-md bg-muted p-4 text-xs">{JSON.stringify(rejection.data || {}, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
