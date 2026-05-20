"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function InterviewDetailPage() {
  const params = useParams<{ interviewId: string }>();
  const interview = useQuery({ queryKey: ["interview", params.interviewId], queryFn: () => api.get<any>("/interviews/" + params.interviewId), retry: false });
  const prep = useMutation({ mutationFn: () => api.post<any>("/interviews/" + params.interviewId + "/prep", {}) });
  return (
    <AppShell>
      <PageHeading title={interview.data?.roundType || "Interview detail"} description="Expected topics, AI preparation plan, questions, answers, feedback, result, and next-round suggestions." />
      <Card><CardHeader><CardTitle>AI preparation</CardTitle></CardHeader><CardContent className="space-y-3"><Button onClick={() => prep.mutate()}>Generate prep</Button><pre className="overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(prep.data || interview.data || {}, null, 2)}</pre></CardContent></Card>
    </AppShell>
  );
}
