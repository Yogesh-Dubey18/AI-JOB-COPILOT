"use client";

import Link from "next/link";
import { BriefcaseBusiness, CalendarClock, FileText, Layers, Sparkles, Target, TrendingUp, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => api.get<any>("/profile"), retry: false });
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: () => api.get<any>("/analytics/overview"), retry: false });
  const jobs = useQuery({ queryKey: ["jobs-daily"], queryFn: () => api.get<any>("/jobs/daily-feed"), retry: false });
  const data = analytics.data || {};
  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back{profile.data?.headline ? ", builder" : ""}</h1>
          <p className="mt-2 text-muted-foreground">Your resume, jobs, applications, interviews, and skill plan in one place.</p>
        </div>
        <Link href="/resume/upload"><Button><FileText className="h-4 w-4" /> Upload resume</Button></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Profile completion" value={(profile.data?.profileCompletenessScore || 35) + "%"} icon={<Target className="h-5 w-5" />} hint="Complete onboarding for better matches" />
        <MetricCard label="Average ATS score" value={data.averageAtsScore || 82} icon={<FileText className="h-5 w-5" />} />
        <MetricCard label="Applications" value={data.totalApplied || 0} icon={<Layers className="h-5 w-5" />} />
        <MetricCard label="Upcoming interviews" value={data.totalInterviews || 0} icon={<CalendarClock className="h-5 w-5" />} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recommended jobs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(jobs.data?.today || []).slice(0, 4).map((job: any) => (
              <div key={job._id} className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
                <div><p className="font-semibold">{job.title}</p><p className="text-sm text-muted-foreground">{job.company} • {job.location}</p></div>
                <Link href={"/jobs/" + job._id}><Button variant="outline">Open</Button></Link>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>AI mentor suggestions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-sm font-semibold">Resume health</p><Progress value={data.averageAtsScore || 82} /></div>
            <p className="text-sm text-muted-foreground">Tailor your resume for the top two roles before applying. Practice project explanation for technical screens.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/skill-gap"><Button variant="outline"><Wrench className="h-4 w-4" /> Skill gaps</Button></Link>
              <Link href="/career-mentor-chat"><Button variant="outline"><Sparkles className="h-4 w-4" /> Ask mentor</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <MetricCard label="Response rate" value={(data.responseRate || 0) + "%"} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Shortlisted" value={data.totalShortlisted || 0} icon={<BriefcaseBusiness className="h-5 w-5" />} />
        <MetricCard label="Missing skills" value="Docker, AWS, Testing" icon={<Wrench className="h-5 w-5" />} />
      </div>
    </AppShell>
  );
}
