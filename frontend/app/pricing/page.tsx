import { CheckCircle2 } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { plans } from "@/lib/plans";

export default function PricingPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">Pricing</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">Choose a job-search operating system that matches your current sprint. Payments are provider-ready and disabled until Stripe, taxes, refunds, and legal policy review are configured.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.id === "pro" ? "border-primary" : ""}>
              <CardHeader>
                <Badge className={plan.id === "pro" ? "w-fit border-primary bg-primary text-primary-foreground" : "w-fit"}>{plan.badge}</Badge>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">INR {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground">{plan.aiCredits} AI credits/month - {plan.dailyMatches} job matches</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{feature}</li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.id === "pro" ? "primary" : "outline"}>Review plan</Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 rounded-md border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Commercial readiness note</p>
          <p className="mt-2">No real billing is active in this demo. Configure Stripe keys, webhooks, tax settings, invoices, cancellation handling, refund policy, and support ownership before charging users.</p>
          <p className="mt-2">AI Job Copilot does not guarantee interviews, offers, salary, selection, or employment. Users must review all AI-generated content before using it.</p>
        </div>
      </main>
    </div>
  );
}
