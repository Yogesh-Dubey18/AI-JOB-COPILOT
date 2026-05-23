"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, ExternalLink, Info, RefreshCw, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const EXTERNAL_DOCS_URL = "https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT";

const STATIC_PROVIDERS = [
  { id: "openai", name: "OpenAI / Gemini AI", category: "AI", description: "Resume analysis, cover letter generation, mock interview, chat, and skill roadmap.", envKey: "OPENAI_API_KEY or GEMINI_API_KEY", setupSteps: ["Obtain an API key from OpenAI or Google AI Studio.", "Add it to backend .env as OPENAI_API_KEY or GEMINI_API_KEY.", "Restart the backend server."] },
  { id: "mongodb", name: "MongoDB Atlas", category: "Database", description: "Primary database for users, resumes, jobs, applications, and interview data.", envKey: "MONGODB_URI", setupSteps: ["Create a free cluster on MongoDB Atlas.", "Copy the connection string.", "Set MONGODB_URI in backend .env."] },
  { id: "linkedin", name: "LinkedIn Jobs API", category: "Job Boards", description: "Live job listings from LinkedIn (requires partner approval).", envKey: "LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET", setupSteps: ["Apply for LinkedIn Jobs API access at developer.linkedin.com.", "Add client credentials to backend .env.", "Enable LINKEDIN_ENABLED=true."] },
  { id: "indeed", name: "Indeed Publisher API", category: "Job Boards", description: "Job feed from Indeed (requires approved publisher account).", envKey: "INDEED_PUBLISHER_ID", setupSteps: ["Sign up at indeed.com/publisher.", "Set INDEED_PUBLISHER_ID in backend .env."] },
  { id: "naukri", name: "Naukri API", category: "Job Boards", description: "India-centric job feed from Naukri.com (requires partner credentials).", envKey: "NAUKRI_API_KEY", setupSteps: ["Contact Naukri for API partner access.", "Set NAUKRI_API_KEY in backend .env."] },
  { id: "stripe", name: "Stripe", category: "Payments", description: "Subscription billing, plan enforcement, and invoices.", envKey: "STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET", setupSteps: ["Create a Stripe account at stripe.com.", "Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to backend .env.", "Configure webhook endpoint in Stripe dashboard."] },
  { id: "google_oauth", name: "Google OAuth", category: "Auth", description: "One-click sign-in via Google.", envKey: "GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET", setupSteps: ["Create OAuth credentials at console.cloud.google.com.", "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend .env."] },
  { id: "sendgrid", name: "SendGrid / Email", category: "Notifications", description: "Transactional emails for reminders, interview alerts, and OTPs.", envKey: "SENDGRID_API_KEY", setupSteps: ["Create a SendGrid account and verify sender domain.", "Set SENDGRID_API_KEY in backend .env."] }
];

const categoryColors: Record<string, string> = {
  AI: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  Database: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "Job Boards": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  Payments: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Auth: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  Notifications: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
};

export default function IntegrationsPage() {
  const readiness = useQuery({ queryKey: ["job-sources"], queryFn: () => api.get<any>("/jobs/sources"), retry: false });

  const liveIds: string[] = readiness.data?.externalProviders
    ?.filter((p: any) => p.isLive)
    .map((p: any) => p.id as string) ?? [];

  const categorized = STATIC_PROVIDERS.reduce<Record<string, typeof STATIC_PROVIDERS>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const liveCount = STATIC_PROVIDERS.filter((p) => liveIds.includes(p.id)).length;

  return (
    <AppShell>
      <PageHeading
        title="Integrations & provider status"
        description="Real-time readiness of every external service. Configure env vars on the backend to activate a provider."
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm">
          <Zap className="h-4 w-4 text-primary" />
          <span><strong>{liveCount}</strong> of <strong>{STATIC_PROVIDERS.length}</strong> providers active</span>
        </div>
        <Button variant="outline" onClick={() => readiness.refetch()} disabled={readiness.isFetching}>
          <RefreshCw className={`h-4 w-4 ${readiness.isFetching ? "animate-spin" : ""}`} />
          Refresh status
        </Button>
        <a href={EXTERNAL_DOCS_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost"><ExternalLink className="h-4 w-4" /> Docs</Button>
        </a>
      </div>

      <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Provider status is determined by backend environment variables. No credentials are shown here. Set the variables listed below in your backend <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">.env</code> file and restart the server to activate a provider.</p>
        </div>
      </div>

      {Object.entries(categorized).map(([category, providers]) => (
        <div key={category} className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {providers.map((provider) => {
              const isLive = liveIds.includes(provider.id);
              return (
                <Card key={provider.id} className={isLive ? "border-emerald-300" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                      <span className="flex items-center gap-2">
                        {isLive
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          : <Circle className="h-4 w-4 text-muted-foreground" />}
                        {provider.name}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${categoryColors[category] || ""}`}>
                        {isLive ? "Live" : "Provider-ready"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                    <div className="rounded-md bg-muted/60 px-3 py-2 font-mono text-xs text-muted-foreground">
                      {provider.envKey}
                    </div>
                    {!isLive && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Setup steps</p>
                        <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground">
                          {provider.setupSteps.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </AppShell>
  );
}
