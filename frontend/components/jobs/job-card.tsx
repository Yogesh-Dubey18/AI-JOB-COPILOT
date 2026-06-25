"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, CheckCircle2, ShieldCheck, Sparkles, XCircle, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

function SourceBadge({ sourceType }: { sourceType?: string }) {
  const label = sourceType ? sourceType : "curated";
  const isLive = ["linkedin", "indeed", "naukri", "ziprecruiter", "dice"].includes((sourceType || "").toLowerCase());
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${isLive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-muted text-muted-foreground"}`}>
      {isLive ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}
      {label}{isLive ? "" : " (provider-ready)"}
    </span>
  );
}

interface JobCardProps {
  job: any;
  isSaved?: boolean;
  isApplied?: boolean;
}

export function JobCard({ job, isSaved = false, isApplied = false }: JobCardProps) {
  const router = useRouter();
  const qc = useQueryClient();
  
  const savedState = job.isSaved || isSaved;
  const appliedState = job.isApplied || isApplied;
  
  const trustColor = (job.trustScore || 0) >= 70 ? "text-success" : (job.trustScore || 0) >= 40 ? "text-amber-600" : "text-danger";

  const trackMutation = useMutation({
    mutationFn: (status: string) => api.post("/applications", {
      jobId: job._id,
      company: job.company,
      role: job.title,
      status: status
    }),
    onSuccess: (res: any) => {
      void qc.invalidateQueries({ queryKey: ["applications"] });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      const status = res?.status || res?.data?.status;
      if (status === "Applied") {
        router.push("/applications");
      }
    }
  });

  const handleSave = () => {
    if (savedState || appliedState) return;
    trackMutation.mutate("Saved");
  };

  const handleTrack = () => {
    if (appliedState) return;
    if (savedState) {
      router.push("/applications");
      return;
    }
    trackMutation.mutate("Applied");
  };

  return (
    <Card className={savedState ? "border-primary/40 bg-primary/[0.01]" : appliedState ? "border-emerald-500/30 bg-emerald-500/[0.01]" : ""}>
      <CardContent className="space-y-3 p-4">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{job.title}</h3>
              {job.isNew ? (
                <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground uppercase tracking-wider animate-pulse">
                  New
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{job.company}{job.location ? ` · ${job.location}` : ""}{job.remoteType ? ` · ${job.remoteType}` : ""}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {job.matchScore ? <Badge className="bg-primary/10 text-primary">AI match {job.matchScore}%</Badge> : null}
            <SourceBadge sourceType={job.sourceType} />
          </div>
        </div>

        {/* Match explanation */}
        {job.whyMatched ? (
          <p className="text-xs text-muted-foreground"><Sparkles className="mr-1 inline h-3 w-3 text-primary" />{job.whyMatched}</p>
        ) : null}

        {/* Strong fit skills */}
        {(job.strongFitSkills || []).length ? (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Strong fit</p>
            <div className="flex flex-wrap gap-1">
              {(job.strongFitSkills as string[]).slice(0, 5).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />{s}
                </span>
              ))}
            </div>
          </div>
        ) : (job.skillsRequired || []).length ? (
          <div className="flex flex-wrap gap-1">{(job.skillsRequired as string[]).slice(0, 5).map((s) => <Badge key={s}>{s}</Badge>)}</div>
        ) : null}

        {/* Missing skills */}
        {(job.missingSkills || []).length ? (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Gaps to close</p>
            <div className="flex flex-wrap gap-1">
              {(job.missingSkills as string[]).slice(0, 4).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  <XCircle className="h-3 w-3" />{s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {(job.salaryMin || job.salaryMax) ? (
            <span>INR {job.salaryMin?.toLocaleString()} – {job.salaryMax?.toLocaleString()}</span>
          ) : null}
          <span className={`flex items-center gap-1 ${trustColor}`}>
            <ShieldCheck className="h-3.5 w-3.5" />Trust {job.trustScore ?? "—"}/100
          </span>
          {job.experienceLevel ? <span>{job.experienceLevel}</span> : null}
          {job.jobType ? <span>{job.jobType}</span> : null}
        </div>

        {/* Risk flag */}
        {(job.riskFlags || []).length ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{job.riskFlags[0]}</p>
        ) : null}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Link href={"/jobs/" + job._id}><Button>Analyze</Button></Link>
          <Link href={`/application-kit/${job._id}`}><Button variant="outline"><Sparkles className="h-4 w-4" /> Generate Application Kit</Button></Link>
          
          <Button
            type="button"
            variant={appliedState ? "outline" : savedState ? "primary" : "outline"}
            onClick={handleTrack}
            disabled={trackMutation.isPending || appliedState}
            aria-label={appliedState ? "Applied" : savedState ? "View Tracker" : `Track ${job.title}`}
          >
            <PlusCircle className="h-4 w-4" /> {appliedState ? "Applied" : savedState ? "View Tracker" : "Track App"}
          </Button>

          {job.applyUrl ? <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline">Official link</Button></a> : null}
          
          <Button
            type="button"
            title={appliedState ? "Applied" : savedState ? "Saved" : "Save job"}
            aria-label={appliedState ? "Applied" : savedState ? "Saved" : `Save ${job.title}`}
            variant="ghost"
            className="w-10 px-0"
            onClick={handleSave}
            disabled={savedState || appliedState || trackMutation.isPending}
          >
            <Bookmark className={`h-4 w-4 ${savedState || appliedState ? "fill-primary text-primary" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
