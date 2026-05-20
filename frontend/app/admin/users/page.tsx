import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AdminusersPage() {
  return <AppShell><FeatureWorkbench title="Admin users" description="View users and job seeker profiles." endpoint="/admin/users" /></AppShell>;
}
