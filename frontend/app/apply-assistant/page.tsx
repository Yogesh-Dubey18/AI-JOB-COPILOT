"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CopyBlock } from "@/components/shared/copy-block";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const KIT_SECTIONS: Array<[string, string]> = [
  ["coverLetter", "Cover letter"],
  ["hrEmail", "HR email"],
  ["linkedinMessage", "LinkedIn message"],
  ["whatsappMessage", "WhatsApp message"],
  ["referralMessage", "Referral request"],
  ["salaryAnswer", "Salary negotiation answer"],
  ["whyHireYouAnswer", "Why hire you?"],
  ["tellMeAboutYourselfAnswer", "Tell me about yourself"]
];

function ApplyAssistantForm() {
  const searchParams = useSearchParams();
  const prefillJobId = searchParams.get("jobId") ?? "";
  const generate = useMutation({ mutationFn: (data: FormData) => api.post<any>("/ai/generate-application-kit", { jobId: data.get("jobId"), resumeVersionId: data.get("resumeVersionId") }) });
  const kit = generate.data || {};
  return (
    <>
      <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p>Review and personalise every generated section before sending. AI output is a starting point — not a final message.</p>
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          generate.mutate(new FormData(event.currentTarget));
        }}
        className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
      >
        <Input name="jobId" placeholder="Job ID" aria-label="Job ID" defaultValue={prefillJobId} />
        <Input name="resumeVersionId" placeholder="Resume version ID" aria-label="Resume version ID" />
        <Button disabled={generate.isPending}><Sparkles className="h-4 w-4" /> {generate.isPending ? "Generating..." : "Generate kit"}</Button>
      </form>
      {generate.isError ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {generate.error instanceof Error ? generate.error.message : "Could not generate application kit."}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {KIT_SECTIONS.map(([key, label]) => (
          <CopyBlock key={key} title={label} value={kit[key] || "Generated content will appear here after you click Generate kit."} />
        ))}
      </div>
    </>
  );
}

export default function ApplyAssistantPage() {
  return (
    <AppShell>
      <PageHeading title="AI apply assistant" description="Generate a user-reviewable application kit: cover letter, HR email, LinkedIn, WhatsApp, referral, salary negotiation, and interview prep content." />
      <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading apply assistant...</div>}>
        <ApplyAssistantForm />
      </Suspense>
    </AppShell>
  );
}
