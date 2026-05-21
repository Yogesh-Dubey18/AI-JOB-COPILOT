"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageSquarePlus, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import { feedbackSchema } from "@/lib/validators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";

type FeedbackValues = z.infer<typeof feedbackSchema>;
type FeedbackList = {
  summary: { total: number; open: number; highPriority: number; averageRating: number };
  items: Array<{ _id: string; type: string; rating?: number; message: string; page?: string; status: string; priority: string; createdAt?: string }>;
};

const feedbackTypes = [
  ["bug", "Bug"],
  ["feature", "Feature"],
  ["ux", "UX"],
  ["content", "Content"],
  ["performance", "Performance"],
  ["security", "Security"],
  ["other", "Other"]
];

export function FeedbackForm() {
  const [success, setSuccess] = useState("");
  const form = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { type: "ux", message: "", page: "", contactEmail: "" }
  });
  const feedback = useQuery({ queryKey: ["my-feedback"], queryFn: () => api.get<FeedbackList>("/feedback/mine"), retry: false });
  const mutation = useMutation({
    mutationFn: (values: FeedbackValues) => api.post<any>("/feedback", values),
    onSuccess: () => {
      setSuccess("Feedback saved for triage.");
      form.reset({ type: "ux", message: "", page: "", contactEmail: "" });
      void feedback.refetch();
    },
    onError: () => setSuccess("")
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquarePlus className="h-5 w-5" /> Share feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium">
                Type
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" {...form.register("type")}>
                  {feedbackTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium">
                Rating
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" {...form.register("rating", { setValueAs: (value) => value === "" ? undefined : Number(value) })}>
                  <option value="">No rating</option>
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
                </select>
              </label>
            </div>
            <label className="space-y-1 text-sm font-medium">
              Page or workflow
              <Input placeholder="/resume/analyzer or Tailor resume flow" {...form.register("page")} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Message
              <Textarea placeholder="What happened, what did you expect, and how much did it affect your workflow?" {...form.register("message")} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Contact email
              <Input placeholder="Optional reply email" type="email" {...form.register("contactEmail")} />
            </label>
            {form.formState.errors.message ? <p className="text-sm text-danger">{form.formState.errors.message.message}</p> : null}
            {mutation.isError ? <p className="text-sm text-danger">{mutation.error instanceof Error ? mutation.error.message : "Could not save feedback."}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>
                <Send className="h-4 w-4" />
                {mutation.isPending ? "Saving..." : "Submit feedback"}
              </Button>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> No public issue is created automatically.</span>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Your feedback history</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {feedback.isLoading ? <LoadingState title="Loading feedback" description="Checking your saved product notes." /> : null}
          {feedback.isError ? <ErrorState description={feedback.error instanceof Error ? feedback.error.message : "Could not load feedback."} action={<RetryButton onClick={() => feedback.refetch()} />} /> : null}
          {!feedback.isLoading && !feedback.isError && !(feedback.data?.items || []).length ? <EmptyState title="No feedback yet" description="Share a bug, improvement, or workflow idea when something slows you down." /> : null}
          {(feedback.data?.items || []).map((item) => (
            <div key={item._id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{item.type}</Badge>
                <Badge>{item.status}</Badge>
                <Badge>{item.priority}</Badge>
                {item.rating ? <Badge>{item.rating}/5</Badge> : null}
              </div>
              <p className="mt-2 text-sm">{item.message}</p>
              {item.page ? <p className="mt-1 text-xs text-muted-foreground">{item.page}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
