"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsCharts } from "@/components/analytics/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: () => api.get<any>("/analytics/overview"), retry: false });
  const data = analytics.data || {};
  return (
    <AppShell>
      <PageHeading title="Analytics dashboard" description="Track saved jobs, applied, shortlisted, interviews, rejected, offers, response rate, ATS trend, sources, missing skills, and weekly activity." />
      <div className="mb-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {["totalSavedJobs", "totalApplied", "totalShortlisted", "totalInterviews", "totalRejected", "totalOffers"].map((key) => <MetricCard key={key} label={key} value={data[key] || 0} />)}
      </div>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <MetricCard label="Response rate" value={(data.responseRate || 0) + "%"} />
        <MetricCard label="Interview rate" value={(data.interviewRate || 0) + "%"} />
        <MetricCard label="Offer rate" value={(data.offerRate || 0) + "%"} />
      </div>
      <AnalyticsCharts data={data} />
    </AppShell>
  );
}
