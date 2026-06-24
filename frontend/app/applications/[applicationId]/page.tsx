"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, Clipboard, Compass, Info, MessageSquare, Sparkles, BrainCircuit, ShieldAlert, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function ApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const router = useRouter();
  
  const app = useQuery({ 
    queryKey: ["application", params.applicationId], 
    queryFn: () => api.get<any>("/applications/" + params.applicationId), 
    retry: false 
  });
  
  const rejection = useMutation({ 
    mutationFn: (data: FormData) => 
      api.post<any>("/ai/rejection-analysis", { 
        applicationId: params.applicationId, 
        rejectionReason: data.get("reason") 
      }) 
  });

  if (app.isLoading) {
    return (
      <AppShell>
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Loading application details...</p>
        </div>
      </AppShell>
    );
  }

  if (app.isError || !app.data) {
    return (
      <AppShell>
        <div className="flex h-[400px] flex-col items-center justify-center gap-4">
          <p className="text-danger">Failed to load application.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </AppShell>
    );
  }

  const application = app.data;

  return (
    <AppShell>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to applications
        </Button>
      </div>

      <PageHeading 
        title={application.role} 
        description={`${application.company} · Application Details`} 
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details and Metadata */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Application Status</CardTitle>
                <Badge className="text-sm font-semibold capitalize bg-primary/10 text-primary border-none">
                  {application.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overview of your progress with {application.company}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm font-semibold">{application.company}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Applied Date</p>
                  <p className="text-sm font-semibold">
                    {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">AI Match Score</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {application.matchScore ? `${application.matchScore}%` : "Pending Analysis"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <Clipboard className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Priority Score</p>
                  <p className="text-sm font-semibold">
                    {application.priorityScore || "Medium"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle>Application Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {application.notes ? (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {application.notes}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No notes recorded for this application. Use the application tracker to update details and add notes.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rejection Analysis */}
          <Card className={application.status === "Rejected" ? "border-danger/30" : ""}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-danger" />
                <CardTitle>Rejection Analysis & Feedback</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                If you were not selected for this role, paste the rejection email or reason below. The AI Copilot will analyze it, identify potential gaps, and recommend improvements.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  rejection.mutate(new FormData(event.currentTarget));
                }}
                className="space-y-3"
              >
                <Textarea 
                  name="reason" 
                  rows={4}
                  placeholder="Paste the rejection email text or description of the feedback received here..." 
                  className="resize-none"
                  required
                />
                <Button disabled={rejection.isPending}>
                  {rejection.isPending ? "Analyzing..." : "Analyze Rejection"}
                </Button>
              </form>

              {rejection.data && (
                <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    <span>AI Copilot Analysis</span>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {typeof rejection.data === "string" 
                      ? rejection.data 
                      : rejection.data.analysis || rejection.data.feedback || JSON.stringify(rejection.data, null, 2)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar next-step CTAs */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <CardTitle>Next Steps</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Power your job search by connecting your workflow actions.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link href={`/company-research?company=${encodeURIComponent(application.company)}`} className="w-full">
                <Button className="w-full gap-2 justify-center py-5 font-semibold text-sm" variant="primary">
                  <Building2 className="h-4 w-4" /> Research Company
                </Button>
              </Link>
              
              <Link href={`/interviews/prep?applicationId=${application._id}`} className="w-full">
                <Button className="w-full gap-2 justify-center py-5 font-semibold text-sm" variant="secondary">
                  <MessageSquare className="h-4 w-4" /> Prepare Interview
                </Button>
              </Link>
              
              <div className="mt-2 rounded-md bg-background/50 border p-3 text-xs text-muted-foreground flex gap-2 items-start">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <p>
                  Researching the company gives you speaking points. Preparing the interview sets up mock practice tailored to this application.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                <p>Drag the card on your board to update the application status as you advance through rounds.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                <p>Use the Rejection Analysis if you get passed on, to optimize your resume for next applications.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
