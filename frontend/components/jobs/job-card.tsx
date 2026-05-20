import Link from "next/link";
import { Bookmark, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function JobCard({ job }: { job: any }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-bold">{job.title}</h3>
            <p className="text-sm text-muted-foreground">{job.company} - {job.location} - {job.remoteType}</p>
          </div>
          <Badge className="bg-primary/10 text-primary">AI match 88%</Badge>
        </div>
        <div className="flex flex-wrap gap-2">{(job.skillsRequired || []).slice(0, 5).map((skill: string) => <Badge key={skill}>{skill}</Badge>)}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>INR {job.salaryMin?.toLocaleString()} - INR {job.salaryMax?.toLocaleString()}</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Trust {job.trustScore}</span>
          <span>Risk {job.scamRiskScore || 0}</span>
          <span>{job.sourceType || "curated"}</span>
        </div>
        {(job.riskFlags || []).length ? <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{job.riskFlags[0]}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Link href={"/jobs/" + job._id}><Button>Analyze</Button></Link>
          <Link href={job.applyUrl || "#"}><Button variant="outline">Official link</Button></Link>
          <Button title="Save job" variant="ghost" className="w-10 px-0"><Bookmark className="h-4 w-4" /></Button>
          <Button title="AI match" variant="ghost" className="w-10 px-0"><Sparkles className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
