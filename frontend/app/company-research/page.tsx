"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, DollarSign, Globe, Info, Plus, Trash2, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const SALARY_TEMPLATES = [
  {
    label: "Current CTC reveal",
    template: "My current CTC is ₹X LPA. I am looking for a hike of 30–40% based on the responsibilities of this role and the market range."
  },
  {
    label: "Expected CTC (no disclosure)",
    template: "Based on my research and the scope of this role, I am targeting ₹X–Y LPA. I am open to discussing the full compensation package including variable pay and benefits."
  },
  {
    label: "Negotiation after offer",
    template: "Thank you for the offer of ₹X LPA. I am very excited about this opportunity. Based on my experience and the market data I have researched, I was hoping for ₹Y LPA. Is there flexibility to meet at ₹Z LPA?"
  },
  {
    label: "Defer salary discussion",
    template: "I prefer to discuss compensation after we have both agreed that I am a strong fit for the role. Could we revisit this once you have completed the evaluation rounds?"
  }
];

export default function CompanyResearchPage() {
  const qc = useQueryClient();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const companies = useQuery({ queryKey: ["company-research"], queryFn: () => api.get<any[]>("/company-research"), retry: false });
  const create = useMutation({
    mutationFn: (data: FormData) => api.post("/company-research", {
      companyName: data.get("companyName"),
      industry: data.get("industry"),
      techStack: String(data.get("techStack") || "").split(",").map((s) => s.trim()).filter(Boolean),
      culture: data.get("culture"),
      glassdoorRating: data.get("glassdoorRating") ? Number(data.get("glassdoorRating")) : undefined,
      salaryRangeMin: data.get("salaryRangeMin") ? Number(data.get("salaryRangeMin")) : undefined,
      salaryRangeMax: data.get("salaryRangeMax") ? Number(data.get("salaryRangeMax")) : undefined,
      interviewProcess: data.get("interviewProcess"),
      careerPageUrl: data.get("careerPageUrl"),
      notes: data.get("notes")
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-research"] })
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/company-research/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-research"] })
  });

  function copyTemplate(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <AppShell>
      <PageHeading
        title="Company research & salary readiness"
        description="Research companies, note their tech stack, culture, Glassdoor rating, and interview process. Use salary answer templates to negotiate confidently."
      />

      {/* Salary templates */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4" />Salary answer templates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="mb-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Always know your target range before any salary discussion. Research Glassdoor, AmbitionBox, LinkedIn Salary, and Levels.fyi for your role, location, and experience level.
          </div>
          {SALARY_TEMPLATES.map((t, i) => (
            <div key={t.label} className="rounded-md border p-3">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{t.label}</p>
              <p className="text-sm">{t.template}</p>
              <Button
                variant="ghost"
                className="mt-2 h-7 px-2 text-xs"
                onClick={() => copyTemplate(t.template, i)}
              >
                {copiedIdx === i ? "Copied!" : "Copy template"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add company research form */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" />Add company research</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); (e.currentTarget as HTMLFormElement).reset(); }}
            className="grid gap-3 md:grid-cols-3"
          >
            <Input name="companyName" placeholder="Company name" aria-label="Company name" required className="md:col-span-2" />
            <Input name="industry" placeholder="Industry" aria-label="Industry" />
            <Input name="techStack" placeholder="Tech stack (comma-separated)" aria-label="Tech stack" className="md:col-span-2" />
            <Input name="glassdoorRating" placeholder="Glassdoor rating (0–5)" aria-label="Glassdoor rating" type="number" min="0" max="5" step="0.1" />
            <Input name="salaryRangeMin" placeholder="Salary min (LPA)" aria-label="Salary min" type="number" />
            <Input name="salaryRangeMax" placeholder="Salary max (LPA)" aria-label="Salary max" type="number" />
            <Input name="careerPageUrl" placeholder="Career page URL" aria-label="Career page URL" />
            <Input name="culture" placeholder="Culture notes (e.g. fast-paced, remote-first)" aria-label="Culture" className="md:col-span-2" />
            <textarea
              name="interviewProcess"
              placeholder="Interview process (e.g. HR → Tech1 → Tech2 → Managerial)"
              aria-label="Interview process"
              className="md:col-span-3 min-h-[64px] rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              name="notes"
              placeholder="Other notes (recent news, products, red flags...)"
              aria-label="Notes"
              className="md:col-span-3 min-h-[64px] rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" disabled={create.isPending} className="md:col-span-3">
              {create.isPending ? "Saving..." : "Save company research"}
            </Button>
          </form>
          {create.isError ? <p role="alert" className="mt-2 text-sm text-danger">{create.error instanceof Error ? create.error.message : "Could not save."}</p> : null}
        </CardContent>
      </Card>

      {companies.isLoading ? <LoadingState title="Loading company research" description="Fetching your saved company notes." /> : null}
      {companies.isError ? <ErrorState description={companies.error instanceof Error ? companies.error.message : "Could not load research."} action={<RetryButton onClick={() => companies.refetch()} />} /> : null}
      {!companies.isLoading && !companies.isError && !(companies.data || []).length ? (
        <EmptyState title="No company research saved" description="Add your first company above. Research salary ranges, tech stack, culture, and interview process before applying." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {(companies.data || []).map((company: any) => (
          <Card key={company._id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />{company.companyName}</span>
                <Button variant="ghost" className="h-7 w-7 shrink-0 px-0" aria-label="Delete" onClick={() => remove.mutate(company._id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {company.industry ? <p className="text-muted-foreground">{company.industry}</p> : null}
              {(company.techStack || []).length ? (
                <div className="flex flex-wrap gap-1">{(company.techStack as string[]).map((s) => <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>)}</div>
              ) : null}
              {(company.salaryRangeMin || company.salaryRangeMax) ? (
                <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <DollarSign className="h-3.5 w-3.5" />₹{company.salaryRangeMin}–{company.salaryRangeMax} LPA
                </p>
              ) : null}
              {company.glassdoorRating ? <p className="text-xs text-muted-foreground">Glassdoor: {company.glassdoorRating}/5</p> : null}
              {company.careerPageUrl ? (
                <a href={company.careerPageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Globe className="h-3.5 w-3.5" />Career page
                </a>
              ) : null}
              {company.culture ? <p className="text-xs text-muted-foreground">Culture: {company.culture}</p> : null}
              {company.interviewProcess ? <p className="rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground">Process: {company.interviewProcess}</p> : null}
              {company.notes ? <p className="rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground">{company.notes}</p> : null}
              <div className="mt-3 border-t pt-2">
                <Link href={`/interviews/prep?company=${encodeURIComponent(company.companyName)}`}>
                  <Button variant="outline" className="w-full h-8 text-xs gap-1.5 font-medium">
                    <MessageSquare className="h-3.5 w-3.5" /> Open Interview Prep
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
