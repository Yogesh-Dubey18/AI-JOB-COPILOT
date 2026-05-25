"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Copy, Download, Eye, FileJson, Globe2, Palette, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function fileHref(fileUrl: string) {
  return fileUrl?.startsWith("http") ? fileUrl : `${backendOrigin}${fileUrl}`;
}

type PortfolioForm = {
  slug: string;
  displayName: string;
  headline: string;
  contactEmail: string;
  resumeUrl: string;
  theme: "classic" | "compact" | "bold";
  isPublished: boolean;
  sections: {
    showEmail: boolean;
    showResume: boolean;
    showProjects: boolean;
    showSkills: boolean;
    showLinks: boolean;
  };
};

const defaultForm: PortfolioForm = {
  slug: "full-stack-developer",
  displayName: "Full Stack Developer",
  headline: "React, Node.js, Express, and MongoDB developer",
  contactEmail: "",
  resumeUrl: "",
  theme: "classic",
  isPublished: false,
  sections: {
    showEmail: false,
    showResume: false,
    showProjects: true,
    showSkills: true,
    showLinks: true
  }
};

export default function PortfolioGeneratorPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PortfolioForm>(defaultForm);
  const [context, setContext] = useState("React, Node.js, Express, MongoDB projects with authentication, dashboards, and responsive UI.");
  const [exportJson, setExportJson] = useState<any>(null);
  const portfolios = useQuery({ queryKey: ["portfolios"], queryFn: () => api.get<any[]>("/portfolios"), retry: false });
  const generate = useMutation({
    mutationFn: () => api.post<any>("/portfolios/generate", { ...form, message: context, portfolioContext: context }),
    onSuccess: (data) => {
      setExportJson(data);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });
  const publish = useMutation({
    mutationFn: (portfolio: any) => api.post<any>(`/portfolios/${portfolio._id}/publish`, { isPublished: !portfolio.isPublished, sections: portfolio.sections, theme: portfolio.theme }),
    onSuccess: (data) => {
      setExportJson(data);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });
  const generatePdf = useMutation({
    mutationFn: (portfolioId: string) => api.post<any>(`/exports/portfolio/${portfolioId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-exports"] });
    }
  });
  const items = portfolios.data || [];
  const latest = generate.data || items[0];

  function publicUrl(slug: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/u/${slug}`;
  }

  function copyPublicUrl(slug: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(publicUrl(slug));
    }
  }

  return (
    <AppShell>
      <PageHeading title="Portfolio generator" description="Create a recruiter-safe public profile with publish controls, themes, and exportable content." />
      <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" data-testid="storage-warning">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Storage & Access Notice</p>
            <p className="mt-1 text-xs">Currently running in development/local storage fallback. Generated portfolios and PDFs are written to local uploads, which means they are publicly accessible via their direct URLs and may be deleted when the server restarts. Secure AWS S3/R2 storage is provider-ready and will be activated in the production environment.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />Builder</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Display name" />
              <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Public slug" />
              <Input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} placeholder="Headline" />
              <Input value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} placeholder="Contact email" />
              <Input className="md:col-span-2" value={form.resumeUrl} onChange={(event) => setForm({ ...form, resumeUrl: event.target.value })} placeholder="Resume URL" />
            </div>
            <Textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Project, resume, and target-role context" />
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium"><Palette className="h-4 w-4" />Theme</p>
              <div className="flex flex-wrap gap-2">
                {(["classic", "compact", "bold"] as const).map((theme) => (
                  <Button key={theme} type="button" variant={form.theme === theme ? "primary" : "outline"} onClick={() => setForm({ ...form, theme })}>{theme}</Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {Object.keys(form.sections).map((key) => (
                <label key={key} className="flex items-center gap-2 rounded-md border p-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.sections[key as keyof PortfolioForm["sections"]])}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, [key]: !form.sections[key as keyof PortfolioForm["sections"]] } })}
                  />
                  {key}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={() => setForm({ ...form, isPublished: !form.isPublished })} />
              Publish after generation
            </label>
            <Button disabled={generate.isPending} onClick={() => generate.mutate()}><Sparkles className="h-4 w-4" />{generate.isPending ? "Generating..." : "Generate portfolio"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Globe2 className="h-4 w-4" />Portfolio preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {latest ? (
              <>
                <div className="rounded-md border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{latest.theme || "classic"}</Badge>
                    <Badge>{latest.isPublished ? "Published" : "Private"}</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{latest.hero || latest.headline}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{latest.about || latest.publicProfile?.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(latest.skills || []).map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => publish.mutate(latest)}>{latest.isPublished ? "Unpublish" : "Publish"}</Button>
                  <Button variant="outline" onClick={() => copyPublicUrl(latest.publicProfile?.slug || latest.slug)}><Copy className="h-4 w-4" />Copy link</Button>
                  <Link href={`/u/${latest.publicProfile?.slug || latest.slug}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"><Eye className="h-4 w-4" />View</Link>
                  <Button variant="outline" onClick={() => setExportJson(latest)}><FileJson className="h-4 w-4" />Export JSON</Button>
                  <Button
                    variant="outline"
                    disabled={generatePdf.isPending}
                    onClick={() => generatePdf.mutate(latest._id || latest.id)}
                    aria-label="Generate Portfolio PDF"
                  >
                    {generatePdf.isPending ? "Generating PDF..." : "Generate PDF"}
                  </Button>
                  {generatePdf.data?.fileUrl && (
                    <a
                      href={fileHref(generatePdf.data.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-emerald-50/50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                      aria-label="Download PDF"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-md border p-5 text-sm text-muted-foreground">No portfolio generated yet.</div>
            )}
            {exportJson ? <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(exportJson, null, 2)}</pre> : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((portfolio: any) => (
          <Card key={portfolio._id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{portfolio.hero || portfolio.headline || portfolio.slug}</h3>
                <Badge>{portfolio.isPublished ? "Published" : "Private"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{portfolio.publicProfile?.slug ? publicUrl(portfolio.publicProfile.slug) : portfolio.slug}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => publish.mutate(portfolio)}>{portfolio.isPublished ? "Unpublish" : "Publish"}</Button>
                <Button variant="ghost" onClick={() => setExportJson(portfolio)}>JSON</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
