import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function JobscamdetectorPage() {
  return <AppShell><FeatureWorkbench title="Job scam detector" description="Paste a job description, company, HR email, and salary to detect fake company, suspicious salary, fees, bad descriptions, and risky promises." mutationEndpoint="/ai/scam-check" /></AppShell>;
}
