"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, HeartPulse } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsCharts } from "@/components/analytics/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: () => api.get<any>("/analytics/overview"), retry: false });
  const data = analytics.data || {};
  const health = data.jobSearchHealth || {};
  return (
    <AppShell>
      <PageHeading title="Analytics dashboard" description="Track saved jobs, applied, shortlisted, interviews, rejected, offers, response rate, ATS trend, sources, missing skills, and weekly activity." />
      <div className="mb-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {["totalSavedJobs", "totalApplied", "totalShortlisted", "totalInterviews", "totalRejected", "totalOffers"].map((key) => <MetricCard key={key} label={key} value={data[key] || 0} />)}
      </div>
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <MetricCard label="Job-search health" value={(health.healthScore || 0) + "/100"} icon={<HeartPulse className="h-5 w-5" />} hint={health.healthLevel || "Needs data"} />
        <MetricCard label="Response rate" value={(data.responseRate || 0) + "%"} />
        <MetricCard label="Interview rate" value={(data.interviewRate || 0) + "%"} />
        <MetricCard label="Offer rate" value={(data.offerRate || 0) + "%"} />
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><HeartPulse className="h-4 w-4" />Health score</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Progress value={health.healthScore || 0} />
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(health.scoreBreakdown || {}).map(([key, value]) => (
                <div key={key} className="rounded-md border p-2"><span className="text-muted-foreground">{key}</span><span className="float-right font-semibold">{String(value)}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" />Next actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(health.bestNextActions || ["Add applications and resume analysis to unlock intelligence."]).slice(0, 5).map((action: string) => (
              <div key={action} className="rounded-md border p-2 text-sm">{action}</div>
            ))}
            {(health.riskFlags || []).length ? <div className="mt-3 flex flex-wrap gap-2">{health.riskFlags.map((flag: string) => <Badge key={flag}><AlertTriangle className="mr-1 h-3 w-3" />{flag}</Badge>)}</div> : null}
          </CardContent>
        </Card>
      </div>
      <AnalyticsCharts data={data} />
    </AppShell>
  );
}
