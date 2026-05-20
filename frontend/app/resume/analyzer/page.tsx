"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export default function ResumeAnalyzerPage() {
  const [resumeId, setResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => api.get<any[]>("/resumes"), retry: false });
  const analyze = useMutation({ mutationFn: () => api.post<any>("/resumes/" + resumeId + "/analyze", { targetRole }) });
  const result = analyze.data;
  return (
    <AppShell>
      <PageHeading title="AI resume ATS analyzer" description="Select a resume and target role to get ATS score, section scores, strengths, weaknesses, missing keywords, recruiter view, and improvement suggestions." />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Analyze resume</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select className="h-10 w-full rounded-md border bg-background px-3" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
              <option value="">Select resume</option>
              {(resumes.data || []).map((resume) => <option key={resume._id} value={resume._id}>{resume.fileName}</option>)}
            </select>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
            <Button disabled={!resumeId || analyze.isPending} onClick={() => analyze.mutate()}><Sparkles className="h-4 w-4" /> {analyze.isPending ? "Analyzing..." : "Analyze resume"}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>ATS result</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-black">{result?.atsScore || 0}</div>
            <Progress value={result?.atsScore || 0} />
            <div className="grid gap-3 md:grid-cols-2">
              {["strengths", "weaknesses", "missingKeywords", "improvementSuggestions"].map((key) => <div key={key} className="rounded-md border p-3"><p className="font-semibold">{key}</p><ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">{(result?.[key] || []).map((item: string) => <li key={item}>{item}</li>)}</ul></div>)}
            </div>
            <p className="text-sm text-muted-foreground">{result?.recruiterView || "Run an analysis to see recruiter view."}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
