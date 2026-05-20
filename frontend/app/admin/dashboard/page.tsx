import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AdmindashboardPage() {
  return <AppShell><FeatureWorkbench title="Admin dashboard" description="Monitor users, jobs, AI usage, scam reports, feedback, and product metrics." endpoint="/admin/users" /></AppShell>;
}
