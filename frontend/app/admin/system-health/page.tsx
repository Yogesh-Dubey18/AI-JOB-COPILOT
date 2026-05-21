import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AdminSystemHealthPage() {
  return <AppShell><FeatureWorkbench title="System health" description="Inspect database mode, AI provider mode, billing provider state, record counts, and safe operational status." endpoint="/admin/system-health" /></AppShell>;
}
