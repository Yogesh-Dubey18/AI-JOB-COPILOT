import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AdminRiskSignalsPage() {
  return <AppShell><FeatureWorkbench title="Risk signals" description="Review high-risk job records, AI fallback rate, admin access denials, and scam report indicators." endpoint="/admin/risk-signals" /></AppShell>;
}
