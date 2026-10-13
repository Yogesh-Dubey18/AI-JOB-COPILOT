"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/status-state";

export function AnalyticsCharts({ data }: { data: any }) {
  const weekly = data?.weeklyApplicationChart || [];
  const trend = data?.resumeScoreTrend || [];
  const status = data?.applicationStatusChart || [];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Weekly applications</CardTitle></CardHeader>
        <CardContent className="h-64">
          {weekly.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={weekly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="applications" fill="#0f766e" /></BarChart></ResponsiveContainer> : <EmptyState title="No applications yet" description="Track applications to see your weekly activity." />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Resume score trend</CardTitle></CardHeader>
        <CardContent className="h-64">
          {trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#d97706" strokeWidth={2} /></LineChart></ResponsiveContainer> : <EmptyState title="No resume scores yet" description="Analyze a resume to start tracking your score." />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Pipeline mix</CardTitle></CardHeader>
        <CardContent className="h-64">
          {status.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={status} dataKey="value" nameKey="name" fill="#2563eb" label /><Tooltip /></PieChart></ResponsiveContainer> : <EmptyState title="Your pipeline is empty" description="Saved and applied jobs will appear here." />}
        </CardContent>
      </Card>
    </div>
  );
}
