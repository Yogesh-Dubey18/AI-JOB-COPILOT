import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function AIusagePage() {
  return <AppShell><FeatureWorkbench title="AI usage" description="Track AI feature usage, status, model, and cost-related metadata." endpoint="/admin/ai-usage" /></AppShell>;
}
