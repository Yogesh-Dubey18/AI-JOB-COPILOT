import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AdminMonitoringPage() {
  return (
    <AppShell>
      <FeatureWorkbench
        title="Monitoring"
        description="Inspect safe health, provider status, monitoring mode, and runbook links without exposing secrets."
        endpoint="/admin/monitoring"
      />
    </AppShell>
  );
}
