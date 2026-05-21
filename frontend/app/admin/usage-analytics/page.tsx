import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AdminUsageAnalyticsPage() {
  return <AppShell><FeatureWorkbench title="Usage analytics" description="Review AI request events, usage credits, active subscriptions, and billing-ready usage telemetry." endpoint="/admin/usage-analytics" /></AppShell>;
}
