import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function CareermentorchatPage() {
  return <AppShell><FeatureWorkbench title="Career mentor chat" description="Ask for resume analysis, job finding, tailored resumes, interview prep, HR replies, LinkedIn headline, tracking help, skills, rejection reasons, or a 7-day job plan." mutationEndpoint="/ai/chat" /></AppShell>;
}
