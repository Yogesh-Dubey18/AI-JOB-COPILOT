"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { plans } from "@/lib/plans";

export default function BillingSettingsPage() {
  const billing = useQuery({ queryKey: ["billing"], queryFn: () => api.get<any>("/billing/summary"), retry: false });
  const checkout = useMutation({ mutationFn: (planId: string) => api.post<any>("/billing/checkout", { planId }) });
  const usage = billing.data?.usage;
  return (
    <AppShell>
      <PageHeading title="Billing and usage" description="Mock billing summary, AI credits, and Stripe-ready checkout architecture." />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <MetricCard label="Current plan" value={billing.data?.currentPlan?.name || "Free"} />
        <MetricCard label="Used AI credits" value={usage?.usedCredits || 0} />
        <MetricCard label="Remaining credits" value={usage?.remainingCredits || 50} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">INR {plan.price}/mo</div>
              <p className="text-sm text-muted-foreground">{plan.features.join(", ")}</p>
              <Button disabled={checkout.isPending} onClick={() => checkout.mutate(plan.id)}>Mock checkout</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {checkout.data ? <pre className="mt-5 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(checkout.data, null, 2)}</pre> : null}
    </AppShell>
  );
}
