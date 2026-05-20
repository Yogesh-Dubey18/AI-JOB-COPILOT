import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function PortfoliogeneratorPage() {
  return <AppShell><FeatureWorkbench title="Portfolio generator" description="Generate recruiter-friendly hero, about, skills, projects, case studies, resume download, contact, and public slug." mutationEndpoint="/ai/portfolio-generator" /></AppShell>;
}
