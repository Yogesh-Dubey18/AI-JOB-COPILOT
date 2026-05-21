import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AdminAuditLogsPage() {
  return <AppShell><FeatureWorkbench title="Audit logs" description="Review sensitive API actions, admin denials, status codes, categories, and operational metadata." endpoint="/admin/audit-logs" /></AppShell>;
}
