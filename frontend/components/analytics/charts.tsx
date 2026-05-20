"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsCharts({ data }: { data: any }) {
  const weekly = data?.weeklyApplicationChart?.length ? data.weeklyApplicationChart : ["Mon", "Tue", "Wed", "Thu"].map((name, index) => ({ name, applications: index + 1 }));
  const trend = data?.resumeScoreTrend?.length ? data.resumeScoreTrend : [{ name: "Base", score: 72 }, { name: "Tailored", score: 91 }];
  const status = data?.applicationStatusChart?.length ? data.applicationStatusChart : [{ name: "Saved", value: 2 }, { name: "Applied", value: 4 }, { name: "Interview", value: 1 }];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Weekly applications</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={weekly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="applications" fill="#0f766e" /></BarChart></ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Resume score trend</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="score" stroke="#d97706" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Pipeline mix</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={status} dataKey="value" nameKey="name" fill="#2563eb" label /><Tooltip /></PieChart></ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
