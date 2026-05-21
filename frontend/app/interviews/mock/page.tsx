"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Brain, CheckCircle2, Code2, History, MessageSquareText, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export default function MockInterviewPage() {
  const [sessionId, setSessionId] = useState("");
  const [answer, setAnswer] = useState("");
  const [role, setRole] = useState("Full Stack Developer");
  const readiness = useQuery({ queryKey: ["interview-readiness"], queryFn: () => api.get<any>("/interviews/readiness"), retry: false });
  const projectCoach = useQuery({ queryKey: ["project-coach", role], queryFn: () => api.get<any>(`/interviews/coach/project?role=${encodeURIComponent(role)}`), retry: false });
  const hrCoach = useQuery({ queryKey: ["hr-coach"], queryFn: () => api.get<any>("/interviews/coach/hr"), retry: false });
  const dsaTracker = useQuery({ queryKey: ["dsa-tracker", role], queryFn: () => api.get<any>(`/interviews/dsa-tracker?role=${encodeURIComponent(role)}`), retry: false });
  const start = useMutation({
    mutationFn: (focus: string) => api.post<any>("/interviews/sessions/start", { role, focus }),
    onSuccess: (data) => setSessionId(data._id)
  });
  const submit = useMutation({ mutationFn: () => api.post<any>("/interviews/sessions/answer", { sessionId, answer }) });
  const session = submit.data || start.data;
  const latestScore = session?.scoreHistory?.at?.(-1);

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title="AI mock interview" description="Practice role-specific project, HR, DSA, and mixed interview sessions with scoring." />
        <Link href="/interviews/history"><Button variant="outline"><History className="h-4 w-4" />History</Button></Link>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Card><CardContent className="space-y-2 p-4"><p className="text-xs text-muted-foreground">Readiness</p><p className="text-2xl font-bold">{readiness.data?.readinessScore || 0}/100</p><Progress value={readiness.data?.readinessScore || 0} /></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Level</p><p className="text-lg font-semibold">{readiness.data?.readinessLevel || "Start preparation"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Mock sessions</p><p className="text-2xl font-bold">{readiness.data?.mockInterviews || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active coach</p><p className="text-2xl font-bold">{readiness.data?.activeSessions || 0}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />Practice session</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role" />
            <div className="flex flex-wrap gap-2">
              {["project", "hr", "dsa", "mixed"].map((focus) => <Button key={focus} variant="outline" onClick={() => start.mutate(focus)}>{focus}</Button>)}
            </div>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-semibold">Current question</p>
              <p className="mt-1 text-muted-foreground">{session?.currentQuestion || "Start a session to get your first question."}</p>
            </div>
            <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" />
            <Button disabled={!sessionId || submit.isPending} onClick={() => submit.mutate()}><MessageSquareText className="h-4 w-4" />Submit answer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" />Scoring</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {latestScore ? Object.entries(latestScore).map(([key, value]) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm"><span>{key}</span><span>{String(value)}/10</span></div>
                <Progress value={Number(value) * 10} />
              </div>
            )) : <p className="text-sm text-muted-foreground">Scores appear after your first answer.</p>}
            {submit.data?.summary ? <p className="rounded-md border p-3 text-sm text-muted-foreground">{submit.data.summary}</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Brain className="h-4 w-4" />Project coach</CardTitle></CardHeader><CardContent className="space-y-2">{(projectCoach.data?.questions || []).map((question: string) => <div key={question} className="rounded-md border p-2 text-sm">{question}</div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" />HR coach</CardTitle></CardHeader><CardContent className="space-y-2">{(hrCoach.data?.questions || []).map((question: string) => <div key={question} className="rounded-md border p-2 text-sm">{question}</div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Code2 className="h-4 w-4" />DSA tracker</CardTitle></CardHeader><CardContent className="space-y-2"><Badge>{dsaTracker.data?.weeklyTarget || 10} weekly target</Badge>{(dsaTracker.data?.categories || []).map((item: string) => <Badge key={item}>{item}</Badge>)}</CardContent></Card>
      </div>
    </AppShell>
  );
}
