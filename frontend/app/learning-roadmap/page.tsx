import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function LearningroadmapPage() {
  return <AppShell><FeatureWorkbench title="Learning roadmap" description="Weekly plans, daily tasks, resources, projects, interview practice, and progress tracking." mutationEndpoint="/ai/skill-gap" /></AppShell>;
}
