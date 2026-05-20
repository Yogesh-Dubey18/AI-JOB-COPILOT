import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function SkillgapPage() {
  return <AppShell><FeatureWorkbench title="Skill gap" description="Compare your profile and resume with target roles and generate a prioritized gap plan." mutationEndpoint="/ai/skill-gap" /></AppShell>;
}
