"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export default function MockInterviewPage() {
  const [sessionId, setSessionId] = useState("");
  const [answer, setAnswer] = useState("");
  const start = useMutation({ mutationFn: (data: FormData) => api.post<any>("/interviews/mock/start", { role: data.get("role") }), onSuccess: (data) => setSessionId(data._id) });
  const submit = useMutation({ mutationFn: () => api.post<any>("/interviews/mock/answer", { sessionId, answer }) });
  return (
    <AppShell>
      <PageHeading title="AI mock interview" description="AI asks questions, scores confidence, technical accuracy, communication, completeness, and gives improved answers." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Start</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                start.mutate(new FormData(event.currentTarget));
              }}
              className="space-y-3"
            >
              <Input name="role" placeholder="Role" defaultValue="Full Stack Developer" />
              <Button>Start mock</Button>
            </form>
            <p className="mt-3 text-sm text-muted-foreground">{start.data?.currentQuestion}</p>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Answer</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer" /><Button disabled={!sessionId} onClick={() => submit.mutate()}>Submit answer</Button><pre className="rounded-md bg-muted p-4 text-xs">{JSON.stringify(submit.data || {}, null, 2)}</pre></CardContent></Card>
      </div>
    </AppShell>
  );
}
