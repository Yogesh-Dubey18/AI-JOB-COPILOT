"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export default function TailorResumePage() {
  const params = useParams<{ jobId: string }>();
  const tailor = useMutation({ mutationFn: () => api.post<any>("/jobs/" + params.jobId + "/tailor-resume", {}) });
  const data = tailor.data;
  return (
    <AppShell>
      <PageHeading title="Tailor resume for job" description="Select base resume, extract required keywords, rewrite summary and skills truthfully, improve project bullets, and save a new resume version." />
      <Card>
        <CardHeader><CardTitle>ATS improvement workflow</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Button onClick={() => tailor.mutate()} disabled={tailor.isPending}>{tailor.isPending ? "Tailoring..." : "Generate tailored resume"}</Button>
          <div className="grid gap-4 md:grid-cols-2"><div><p className="font-semibold">Before ATS</p><Progress value={data?.beforeAtsScore || 68} /></div><div><p className="font-semibold">After ATS</p><Progress value={data?.afterAtsScore || 91} /></div></div>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(data || { rules: ["Do not fake experience", "Do not add unknown skills", "Use keywords naturally", "Keep ATS friendly"] }, null, 2)}</pre>
        </CardContent>
      </Card>
    </AppShell>
  );
}
