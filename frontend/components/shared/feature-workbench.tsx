"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { ReactNode, useId, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";

export function FeatureWorkbench({
  title,
  description,
  endpoint,
  mutationEndpoint,
  placeholder,
  children
}: {
  title: string;
  description: string;
  endpoint?: string;
  mutationEndpoint?: string;
  placeholder?: string;
  children?: ReactNode;
}) {
  const [input, setInput] = useState("");
  const inputId = useId();
  const query = useQuery({ queryKey: [endpoint], queryFn: () => api.get<any>(endpoint!), enabled: Boolean(endpoint), retry: false });
  const aiStatus = useQuery({ queryKey: ["ai-status"], queryFn: () => api.get<any>("/ai/status"), retry: false });
  const mutation = useMutation({ mutationFn: () => api.post<any>(mutationEndpoint!, { message: input, jobDescription: input, targetRole: input || "Full Stack Developer" }) });
  const result = mutation.data || query.data;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>
      </div>
      {children}
      {aiStatus.data ? (
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border bg-card p-3 text-sm">
            <p className="font-semibold">Provider</p>
            <p className="text-muted-foreground">{aiStatus.data.provider} / {aiStatus.data.model}</p>
          </div>
          <div className="rounded-md border bg-card p-3 text-sm">
            <p className="font-semibold">Fallback</p>
            <p className="text-muted-foreground">{aiStatus.data.fallbackEnabled ? "Mock-safe enabled" : "Provider only"}</p>
          </div>
          <div className="rounded-md border bg-card p-3 text-sm">
            <p className="font-semibold">Validation</p>
            <p className="text-muted-foreground">{aiStatus.data.schemaValidation}</p>
          </div>
          <div className="rounded-md border bg-card p-3 text-sm">
            <p className="font-semibold">Safety</p>
            <p className="text-muted-foreground">{aiStatus.data.safety?.mode || "strict"}</p>
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>AI workspace</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label htmlFor={inputId} className="text-sm font-medium">Context</label>
            <Textarea id={inputId} value={input} onChange={(event) => setInput(event.target.value)} placeholder={placeholder || "Paste job description, target role, or context"} />
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-md border p-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Review drafts before sending</div>
              <div className="flex items-center gap-2 rounded-md border p-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> No invented experience</div>
            </div>
            <Button type="button" disabled={!mutationEndpoint || mutation.isPending} onClick={() => mutation.mutate()} aria-busy={mutation.isPending}>
              <Sparkles className="h-4 w-4" />
              {mutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {query.isLoading ? <LoadingState title="Loading workspace data" description="Fetching the latest saved output and provider status." /> : null}
            {query.isError ? <ErrorState description={query.error instanceof Error ? query.error.message : "Could not load workspace data."} action={<RetryButton onClick={() => query.refetch()} />} /> : null}
            {mutation.isError ? <ErrorState description={mutation.error instanceof Error ? mutation.error.message : "AI request failed."} action={<RetryButton onClick={() => mutation.mutate()} label="Try again" />} /> : null}
            {!query.isLoading && !query.isError && !mutation.isError && !result ? (
              <EmptyState title="Ready for a reviewed AI draft" description="Paste the job, role, or resume context, generate the output, then review it before using it outside the app." />
            ) : null}
            {result ? <pre aria-label="Generated AI result" className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(result, null, 2)}</pre> : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
