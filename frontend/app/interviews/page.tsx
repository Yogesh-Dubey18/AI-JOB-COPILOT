"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, CalendarClock, CheckCircle2, Info, MessageSquare, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const ROUND_TYPES = ["HR Screening", "Technical Round", "System Design", "Assignment", "Culture Fit", "Final Round", "Offer Discussion"];
const MODES = ["Video Call", "Phone", "In-Person", "Take-home Assignment"];
const RESULTS = ["Pending", "Passed", "Rejected", "Offer", "No Show", "Rescheduled"];

const RESULT_COLORS: Record<string, string> = {
  Passed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Offer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  "No Show": "bg-muted text-muted-foreground",
  Rescheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
};

export default function InterviewsPage() {
  const qc = useQueryClient();
  const interviews = useQuery({ queryKey: ["interviews"], queryFn: () => api.get<any[]>("/interviews"), retry: false });
  const create = useMutation({
    mutationFn: (data: FormData) => api.post("/interviews", {
      roundType: data.get("roundType"),
      company: data.get("company"),
      role: data.get("role"),
      scheduledAt: data.get("scheduledAt") || undefined,
      mode: data.get("mode"),
      interviewerName: data.get("interviewerName"),
      topicsExpected: String(data.get("topicsExpected") || "").split(",").map((x) => x.trim()).filter(Boolean),
      result: data.get("result") || "Pending",
      feedback: data.get("feedback")
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interviews"] })
  });

  return (
    <AppShell>
      <PageHeading title="Interview tracker & prep" description="Log every interview round, track results, and prepare with the STAR method and mock interview tool." />

      {/* STAR method reminder */}
      <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">STAR method for behavioral questions</p>
            <p className="mt-1 text-xs">Situation → Task → Action → Result. For technical rounds: understand the problem, state your approach, write clean code, test edge cases. Use your Answer Vault for prepared responses.</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/mock-interview"><Button variant="outline"><Bot className="h-4 w-4" /> Mock interview</Button></Link>
        <Link href="/answer-vault"><Button variant="outline"><MessageSquare className="h-4 w-4" /> Answer vault</Button></Link>
        <Link href="/career-mentor-chat"><Button variant="outline"><Bot className="h-4 w-4" /> Career mentor</Button></Link>
      </div>

      {/* Checklist */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="text-base">Pre-interview checklist</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {[
              "Research the company: mission, recent news, tech stack",
              "Review the job description and map your experience to it",
              "Prepare 3 STAR stories: leadership, conflict, failure/learning",
              "Run 2 mock interviews the night before",
              "Prepare questions to ask the interviewer",
              "Test your audio/video for video calls (camera, mic, background)",
              "Keep your resume, offer letter notes, and salary answer ready"
            ].map((item) => (
              <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Add interview form */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" />Log interview round</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => { event.preventDefault(); create.mutate(new FormData(event.currentTarget)); (event.currentTarget as HTMLFormElement).reset(); }}
            className="grid gap-3 md:grid-cols-3"
          >
            <Input name="company" placeholder="Company" aria-label="Company" required />
            <Input name="role" placeholder="Role" aria-label="Role" />
            <select name="roundType" aria-label="Round type" className="rounded-md border bg-background px-3 py-2 text-sm">
              {ROUND_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Input name="scheduledAt" type="datetime-local" aria-label="Scheduled date and time" />
            <select name="mode" aria-label="Interview mode" className="rounded-md border bg-background px-3 py-2 text-sm">
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <Input name="interviewerName" placeholder="Interviewer name" aria-label="Interviewer name" />
            <Input name="topicsExpected" placeholder="Expected topics (comma-separated)" aria-label="Topics" className="md:col-span-2" />
            <select name="result" aria-label="Result" className="rounded-md border bg-background px-3 py-2 text-sm">
              {RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <textarea name="feedback" placeholder="Feedback / notes after the interview" aria-label="Feedback" className="md:col-span-3 min-h-[64px] rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <Button type="submit" disabled={create.isPending} className="md:col-span-3">
              {create.isPending ? "Saving..." : "Log interview"}
            </Button>
          </form>
          {create.isError ? <p role="alert" className="mt-2 text-sm text-danger">{create.error instanceof Error ? create.error.message : "Could not log interview."}</p> : null}
        </CardContent>
      </Card>

      {interviews.isLoading ? <LoadingState title="Loading interviews" description="Fetching your interview rounds." /> : null}
      {interviews.isError ? <ErrorState description={interviews.error instanceof Error ? interviews.error.message : "Could not load interviews."} action={<RetryButton onClick={() => interviews.refetch()} />} /> : null}
      {!interviews.isLoading && !interviews.isError && !(interviews.data || []).length ? (
        <EmptyState title="No interviews logged yet" description="Log your first interview round above. Track every round, result, and feedback to spot patterns and improve." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {(interviews.data || []).map((item: any) => (
          <Card key={item._id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span>{item.roundType}</span>
                {item.result ? (
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${RESULT_COLORS[item.result] || "bg-muted text-muted-foreground"}`}>{item.result}</span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(item.company || item.role) ? <p className="font-semibold">{item.company}{item.role ? ` · ${item.role}` : ""}</p> : null}
              {(item.mode || item.interviewerName) ? <p className="text-muted-foreground">{item.mode}{item.interviewerName ? ` · ${item.interviewerName}` : ""}</p> : null}
              {item.scheduledAt ? <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />{new Date(item.scheduledAt).toLocaleString()}</p> : null}
              {(item.topicsExpected || []).length ? (
                <div className="flex flex-wrap gap-1">{(item.topicsExpected as string[]).map((t) => <span key={t} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t}</span>)}</div>
              ) : null}
              {item.feedback ? <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">{item.feedback}</p> : null}
              <Link href={`/interviews/${item._id}`}><Button variant="outline" className="w-full text-xs">View details</Button></Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
