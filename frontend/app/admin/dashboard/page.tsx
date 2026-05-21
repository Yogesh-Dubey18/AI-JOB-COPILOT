import Link from "next/link";
import { Activity, Bot, BriefcaseBusiness, ClipboardList, HeartPulse, MessageSquare, ShieldAlert, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const adminCards = [
  ["/admin/users", Users, "Users", "Review job seekers, onboarding health, and account roles."],
  ["/admin/jobs", BriefcaseBusiness, "Jobs", "Manage curated jobs, trust signals, and source quality."],
  ["/admin/ai-usage", Bot, "AI usage", "Monitor fallback usage, feature demand, and future billing cost."],
  ["/admin/usage-analytics", Activity, "Usage analytics", "Review AI credits, subscriptions, and billing usage events."],
  ["/admin/audit-logs", ClipboardList, "Audit logs", "Review sensitive actions, admin access, and operational changes."],
  ["/admin/system-health", HeartPulse, "System health", "Check provider modes, database mode, counts, and runtime status."],
  ["/admin/risk-signals", ShieldAlert, "Risk signals", "Spot high-risk jobs, fallback spikes, and admin access denials."],
  ["/admin/feedback", MessageSquare, "Feedback", "Review user feedback and convert it into issues."],
  ["/analytics", Activity, "Product analytics", "Inspect application conversion and job-search health."]
] as const;

export default function AdminDashboardPage() {
  return (
    <AppShell>
      <PageHeading title="Admin dashboard" description="Operate users, jobs, AI usage, feedback, and product health from one place." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map(([href, Icon, title, text]) => (
          <Link key={href} href={href}>
            <Card className="h-full transition hover:border-primary">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4" />{title}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{text}</p></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
