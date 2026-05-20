"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function InterviewsPage() {
  const qc = useQueryClient();
  const interviews = useQuery({ queryKey: ["interviews"], queryFn: () => api.get<any[]>("/interviews"), retry: false });
  const create = useMutation({ mutationFn: (data: FormData) => api.post("/interviews", { roundType: data.get("roundType"), scheduledAt: data.get("scheduledAt"), mode: data.get("mode"), interviewerName: data.get("interviewerName"), topicsExpected: String(data.get("topicsExpected") || "").split(",").map((x) => x.trim()).filter(Boolean) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["interviews"] }) });
  return (
    <AppShell>
      <PageHeading title="Interview tracker" description="Add rounds, schedule, expected topics, interviewer, feedback, result, and next steps." />
      <Card className="mb-5">
        <CardHeader><CardTitle>Add interview</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate(new FormData(event.currentTarget));
            }}
            className="grid gap-3 md:grid-cols-3"
          >
            <Input name="roundType" placeholder="Round type" />
            <Input name="scheduledAt" type="datetime-local" />
            <Input name="mode" placeholder="Mode" />
            <Input name="interviewerName" placeholder="Interviewer" />
            <Input name="topicsExpected" placeholder="Topics" />
            <Button>Add interview</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">{(interviews.data || []).map((item) => <Card key={item._id}><CardHeader><CardTitle>{item.roundType}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.mode} • {item.interviewerName}</p></CardContent></Card>)}</div>
    </AppShell>
  );
}
