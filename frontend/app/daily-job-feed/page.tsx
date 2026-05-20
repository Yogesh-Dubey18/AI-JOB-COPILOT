import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function DailyJobFeedPage() {
  return <AppShell><FeatureWorkbench title="Daily job feed" description="Today’s jobs, remote jobs, fresher jobs, internships, walk-ins, and saved filters." endpoint="/jobs/daily-feed" /></AppShell>;
}
