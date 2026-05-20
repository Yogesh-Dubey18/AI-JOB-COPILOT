import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function SettingsPage() {
  return <AppShell><FeatureWorkbench title="Settings" description="Account settings, password, notifications, privacy, delete/export placeholders, and AI usage summary." endpoint="/auth/me" /></AppShell>;
}
