"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bookmark, FileText, ShieldAlert, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export function JobDetailClient({ jobId }: { jobId: string }) {
  const job = useQuery({ queryKey: ["job", jobId], queryFn: () => api.get<any>("/jobs/" + jobId), retry: false });
  const match = useMutation({ mutationFn: () => api.post<any>("/jobs/" + jobId + "/match", {}) });
  const data = job.data;
  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{data?.title || "Job detail"}</h1>
          <p className="mt-2 text-muted-foreground">{data?.company} • {data?.location} • {data?.jobType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={"/jobs/" + jobId + "/tailor-resume"}><Button><FileText className="h-4 w-4" /> Tailor resume</Button></Link>
          <Button variant="outline" onClick={() => match.mutate()}><Sparkles className="h-4 w-4" /> Match</Button>
          <Button title="Save job" variant="outline" className="w-10 px-0"><Bookmark className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
        <Card><CardHeader><CardTitle>Job description</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{data?.description}</p><div className="flex flex-wrap gap-2">{(data?.skillsRequired || []).map((skill: string) => <Badge key={skill}>{skill}</Badge>)}</div><p className="text-sm">Salary: ₹{data?.salaryMin?.toLocaleString()} - ₹{data?.salaryMax?.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>AI adviser</CardTitle></CardHeader><CardContent className="space-y-4"><div className="text-4xl font-black">{match.data?.matchScore || 88}%</div><Progress value={match.data?.matchScore || 88} /><p className="text-sm text-muted-foreground">{match.data?.recommendationReason || "Strong role fit if your resume is tailored to the required keywords."}</p><div className="rounded-md border p-3"><p className="font-semibold">Missing skills</p><p className="text-sm text-muted-foreground">{(match.data?.missingSkills || ["Docker", "AWS"]).join(", ")}</p></div><div className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4 text-warning" /> Scam risk {data?.scamRiskScore || 12} • Trust {data?.trustScore || 82}</div></CardContent></Card>
      </div>
    </AppShell>
  );
}
