"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { plans } from "@/lib/plans";

export default function BillingSettingsPage() {
  const billing = useQuery({ queryKey: ["billing"], queryFn: () => api.get<any>("/billing/summary"), retry: false });
  const planCatalog = useQuery({ queryKey: ["billing-plans"], queryFn: () => api.get<any>("/billing/plans"), retry: false });
  const checkout = useMutation({ mutationFn: (planId: string) => api.post<any>("/billing/checkout", { planId }) });
  const activate = useMutation({ mutationFn: (planId: string) => api.post<any>("/billing/mock/activate", { planId }) });
  const usage = billing.data?.usage;
  const limit = usage?.plan?.aiCreditsPerMonth || 50;
  const used = usage?.usedCredits || 0;
  const usagePercent = Math.min(100, Math.round((used / limit) * 100));
  return (
    <AppShell>
      <PageHeading title="Billing and usage" description="Mock billing summary, AI credits, and Stripe-ready checkout architecture." />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <MetricCard label="Current plan" value={billing.data?.currentPlan?.name || "Free"} />
        <MetricCard label="Used AI credits" value={usage?.usedCredits || 0} />
        <MetricCard label="Remaining credits" value={usage?.remainingCredits || 50} />
      </div>
      <Card className="mb-5">
        <CardHeader><CardTitle>Usage limit</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Progress value={usagePercent} />
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <span>{used} of {limit} credits used</span>
            <span>{usage?.fallbackEvents || 0} fallback/mock AI events</span>
            <span>{billing.data?.provider?.mockOnly ? "Mock billing active" : "Stripe-ready mode"}</span>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {(planCatalog.data?.plans || plans).map((plan: any) => (
          <Card key={plan.id}>
            <CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">INR {plan.monthlyPriceInr ?? plan.price}/mo</div>
              <p className="text-sm text-muted-foreground">{plan.aiCreditsPerMonth ?? plan.aiCredits} AI credits/month · {plan.dailyJobMatches ?? plan.dailyMatches} job matches</p>
              <p className="text-sm text-muted-foreground">{plan.upgradePrompt || plan.features.join(", ")}</p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={checkout.isPending} onClick={() => checkout.mutate(plan.id)}>Mock checkout</Button>
                <Button variant="outline" disabled={activate.isPending} onClick={() => activate.mutate(plan.id)}>Activate demo</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {checkout.data ? <pre className="mt-5 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(checkout.data, null, 2)}</pre> : null}
      {activate.data ? <pre className="mt-5 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(activate.data, null, 2)}</pre> : null}
    </AppShell>
  );
}
