import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function FeedbackPage() {
  return <AppShell><FeatureWorkbench title="Feedback" description="Review user feedback and product issues." endpoint="/admin/feedback" /></AppShell>;
}
