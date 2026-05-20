"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function ResumeVersionsPage() {
  const versions = useQuery({ queryKey: ["resume-versions"], queryFn: () => api.get<any[]>("/resumes/versions"), retry: false });
  return (
    <AppShell>
      <PageHeading title="Resume version history" description="Base, role-specific, and job-specific resume versions with ATS scores, preview, and download placeholders." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(versions.data || []).map((version) => <Card key={version._id}><CardHeader><CardTitle>{version.title}</CardTitle></CardHeader><CardContent><Badge>ATS {version.atsScore || 0}</Badge><p className="mt-3 text-sm text-muted-foreground">{version.targetRole}</p></CardContent></Card>)}
      </div>
    </AppShell>
  );
}
