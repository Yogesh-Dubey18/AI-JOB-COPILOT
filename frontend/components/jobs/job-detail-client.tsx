"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bookmark, Braces, Briefcase, FileText, MapPin, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

type FitDetail = { score: number; reason: string };

function FitRow({
  icon: Icon,
  label,
  fit
}: {
  icon: typeof MapPin;
  label: string;
  fit?: FitDetail;
}) {
  if (!fit) return null;
  const tone = fit.score >= 70 ? "text-emerald-600" : fit.score >= 45 ? "text-amber-600" : "text-red-600";
  return (
    <div className="space-y-1 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </div>
        <span className={"text-sm font-semibold " + tone}>{fit.score}%</span>
      </div>
      <Progress value={fit.score} className="h-1.5" />
      <p className="text-xs text-muted-foreground">{fit.reason}</p>
    </div>
  );
}

export function JobDetailClient({ jobId }: { jobId: string }) {
  const job = useQuery({ queryKey: ["job", jobId], queryFn: () => api.get<any>("/jobs/" + jobId), retry: false });
  const match = useMutation({ mutationFn: () => api.post<any>("/jobs/" + jobId + "/match", {}) });
  const data = job.data;
  const matchData = match.data;

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
        <Card>
          <CardHeader><CardTitle>Job description</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{data?.description}</p>
            <div className="flex flex-wrap gap-2">
              {(data?.skillsRequired || []).map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
            </div>
            <p className="text-sm">Salary: ₹{data?.salaryMin?.toLocaleString()} - ₹{data?.salaryMax?.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>AI adviser</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl font-black">{matchData?.matchScore || 88}%</div>
              <Progress value={matchData?.matchScore || 88} />
              <p className="mt-2 text-sm text-muted-foreground">
                {matchData?.recommendationReason || "Strong role fit if your resume is tailored to the required keywords."}
              </p>
            </div>

            {matchData ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Fit breakdown (based on your profile)
                </p>
                <FitRow icon={MapPin} label="Location fit" fit={matchData.locationFit} />
                <FitRow icon={Wallet} label="Salary fit" fit={matchData.salaryFit} />
                <FitRow icon={Briefcase} label="Experience fit" fit={matchData.experienceFit} />
                {matchData.semanticFit?.available && (
                  <FitRow icon={Braces} label="Conceptual skill fit" fit={matchData.semanticFit} />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click "Match" to see how this role fits your saved profile preferences (location, salary, experience level).
              </p>
            )}

            <div className="rounded-md border p-3">
              <p className="font-semibold">Missing skills</p>
              <p className="text-sm text-muted-foreground">{(matchData?.missingSkills || ["Docker", "AWS"]).join(", ")}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-warning" /> Scam risk {data?.scamRiskScore || 12} • Trust {data?.trustScore || 82}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

