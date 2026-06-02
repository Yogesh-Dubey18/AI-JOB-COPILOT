"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type MaintenanceRun = {
  runId: string;
  jobType: "proof_archive_cleanup";
  triggeredBy: "admin" | "system" | "manual";
  status: "started" | "completed" | "failed" | "partial";
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  scannedCount?: number;
  expiredCount?: number;
  deletedCount?: number;
  skippedCount?: number;
  failedCount?: number;
  safeSummary?: string;
  failureReason?: string;
};

type MaintenanceRunsResponse = {
  items: MaintenanceRun[];
  total: number;
  warning: string;
};

type CleanupResponse = {
  scannedCount: number;
  expiredMarkedCount: number;
  deletedArtifactCount: number;
  skippedCount: number;
  failedCount: number;
  safeSummary: string;
  maintenanceRun?: MaintenanceRun;
};

function statusClass(status: MaintenanceRun["status"]) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "partial") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}

function metric(label: string, value?: number) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{Number(value || 0)}</p>
    </div>
  );
}

export default function AdminMaintenancePage() {
  const runs = useQuery({
    queryKey: ["admin-maintenance-runs"],
    queryFn: () => api.get<MaintenanceRunsResponse>("/admin/maintenance/runs?jobType=proof_archive_cleanup"),
    retry: false
  });

  const cleanup = useMutation({
    mutationFn: () => api.post<CleanupResponse>("/admin/maintenance/proof-archives/cleanup", { limit: 25 }),
    onSuccess: () => {
      runs.refetch();
    }
  });

  const latest = cleanup.data?.maintenanceRun || runs.data?.items?.[0];

  return (
    <AppShell>
      <section className="space-y-5">
        <PageHeading
          title="Maintenance"
          description="Review admin-safe cleanup run history for generated proof archive artifacts. Public portfolios never expose cleanup state."
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Proof Archive Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cleanup targets generated archive ZIP artifacts only. It never deletes original proof files, retained-for-audit files, public portfolio assets, or source uploads.
            </p>
            <p className="text-sm text-muted-foreground">
              Run history stores counts, timestamps, status, and safe summaries only. It does not store archive keys, private paths, bucket URLs, signed URL tokens, or file contents.
            </p>
            <Button type="button" onClick={() => cleanup.mutate()} disabled={cleanup.isPending} aria-busy={cleanup.isPending}>
              <RefreshCw className="h-4 w-4" />
              {cleanup.isPending ? "Running cleanup..." : "Run cleanup now"}
            </Button>
            {cleanup.isError ? (
              <ErrorState
                description={cleanup.error instanceof Error ? cleanup.error.message : "Archive cleanup failed safely."}
                action={<RetryButton onClick={() => cleanup.mutate()} label="Retry cleanup" />}
              />
            ) : null}
            {cleanup.data ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm" data-testid="maintenance-cleanup-result">
                <p className="font-semibold">Latest cleanup response</p>
                <p className="mt-1 text-muted-foreground">{cleanup.data.safeSummary}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-5">
                  {metric("Scanned", cleanup.data.scannedCount)}
                  {metric("Expired", cleanup.data.expiredMarkedCount)}
                  {metric("Deleted", cleanup.data.deletedArtifactCount)}
                  {metric("Skipped", cleanup.data.skippedCount)}
                  {metric("Failed", cleanup.data.failedCount)}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card data-testid="maintenance-run-history">
          <CardHeader>
            <CardTitle>Maintenance Run History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {runs.isLoading ? <LoadingState title="Loading maintenance runs" description="Fetching admin-safe run history." /> : null}
            {runs.isError ? (
              <ErrorState
                description={runs.error instanceof Error ? runs.error.message : "Could not load maintenance run history."}
                action={<RetryButton onClick={() => runs.refetch()} />}
              />
            ) : null}

            {latest ? (
              <div className="rounded-md border p-4" data-testid="latest-maintenance-run">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Latest proof archive cleanup summary</p>
                    <p className="mt-1 font-semibold">{latest.safeSummary || "Cleanup run recorded with safe metadata only."}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Last run: {formatDate(latest.startedAt)}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusClass(latest.status)}`}>
                    {latest.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                  {metric("Scanned", latest.scannedCount)}
                  {metric("Expired", latest.expiredCount)}
                  {metric("Deleted", latest.deletedCount)}
                  {metric("Skipped", latest.skippedCount)}
                  {metric("Failed", latest.failedCount)}
                </div>
                {latest.failureReason ? <p className="mt-3 text-sm font-semibold text-amber-700">Safe failure reason: {latest.failureReason}</p> : null}
              </div>
            ) : null}

            {runs.data?.warning ? <p className="text-sm text-muted-foreground">{runs.data.warning}</p> : null}

            <div className="space-y-3">
              {(runs.data?.items || []).map((run) => (
                <article key={run.runId} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">Proof archive cleanup</p>
                      <p className="text-sm text-muted-foreground">{formatDate(run.startedAt)} · Triggered by {run.triggeredBy}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusClass(run.status)}`}>
                      {run.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{run.safeSummary || "Safe maintenance run summary unavailable."}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scanned {Number(run.scannedCount || 0)}, expired {Number(run.expiredCount || 0)}, deleted {Number(run.deletedCount || 0)}, skipped {Number(run.skippedCount || 0)}, failed {Number(run.failedCount || 0)}.
                  </p>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
