import { AppShell } from "@/components/layout/app-shell";
import { FeatureWorkbench } from "@/components/shared/feature-workbench";

export default function ResumeBuilderPage() {
  return (
    <AppShell>
      <FeatureWorkbench title="AI resume builder" description="Create professional one-page, fresher, full-stack, React, backend, or Java developer resume versions with live-preview-ready content." mutationEndpoint="/ai/tailor-resume" placeholder="Describe your target role or paste a job description." />
    </AppShell>
  );
}
