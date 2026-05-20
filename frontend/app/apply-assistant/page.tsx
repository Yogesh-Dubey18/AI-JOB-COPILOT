"use client";

import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CopyBlock } from "@/components/shared/copy-block";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ApplyAssistantPage() {
  const generate = useMutation({ mutationFn: (data: FormData) => api.post<any>("/ai/generate-application-kit", { jobId: data.get("jobId"), resumeVersionId: data.get("resumeVersionId") }) });
  const kit = generate.data || {};
  return (
    <AppShell>
      <PageHeading title="AI apply assistant" description="Generate user-reviewable cover letter, HR email, LinkedIn, WhatsApp, referral, salary, intro, why-hire, and interview prep content." />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          generate.mutate(new FormData(event.currentTarget));
        }}
        className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
      >
        <Input name="jobId" placeholder="Job ID" />
        <Input name="resumeVersionId" placeholder="Resume version ID" />
        <Button disabled={generate.isPending}><Sparkles className="h-4 w-4" /> Generate kit</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {["coverLetter", "hrEmail", "linkedinMessage", "whatsappMessage", "referralMessage", "salaryAnswer", "whyHireYouAnswer", "tellMeAboutYourselfAnswer"].map((key) => <CopyBlock key={key} title={key} value={kit[key] || "Generated content will appear here."} />)}
      </div>
    </AppShell>
  );
}
