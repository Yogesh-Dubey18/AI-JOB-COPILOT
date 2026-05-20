import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AdminjobsPage() {
  return <AppShell><FeatureWorkbench title="Admin jobs" description="Add, edit, delete, and monitor job records." endpoint="/admin/jobs" /></AppShell>;
}
