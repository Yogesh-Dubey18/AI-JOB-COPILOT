"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Copy, Download, Eye, FileJson, Globe2, Palette, Sparkles, Upload, Wrench } from "lucide-react";
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
  title: string;
  displayName: string;
  headline: string;
  contactEmail: string;
  contactPhone: string;
  githubUrl: string;
  linkedinUrl: string;
  resumeUrl: string;
  skillsText: string;
  projectsText: string;
  theme: "classic" | "compact" | "bold";
  isPublished: boolean;
  sections: {
    showEmail: boolean;
    showPhone: boolean;
    showResume: boolean;
    showProjects: boolean;
    showSkills: boolean;
    showLinks: boolean;
    showRoadmap: boolean;
  };
};

const defaultForm: PortfolioForm = {
  slug: "portfolio-slug",
  title: "",
  displayName: "",
  headline: "",
  contactEmail: "",
  contactPhone: "",
  githubUrl: "",
  linkedinUrl: "",
  resumeUrl: "",
  skillsText: "",
  projectsText: "",
  theme: "classic",
  isPublished: false,
  sections: {
    showEmail: false,
    showPhone: false,
    showResume: false,
    showProjects: true,
    showSkills: true,
    showLinks: true,
    showRoadmap: false
  }
};

const reservedSlugs = new Set([
  "admin", "api", "dashboard", "settings", "profile", "resume", "resumes",
  "jobs", "applications", "interviews", "portfolio", "portfolios", "login",
  "register", "auth", "public", "u", "help", "about", "blog", "pricing",
  "contact", "features", "feedback"
]);

function validateSlugInput(slug: string) {
  if (slug.length < 3 || slug.length > 30) return "Slug must be between 3 and 30 characters.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Slug can only contain lowercase letters, numbers, and single hyphens (no spaces, underscores, or special characters).";
  if (reservedSlugs.has(slug)) return "This slug is reserved. Please choose a more specific portfolio slug.";
  return null;
}

function parseSkills(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseProjects(value: string) {
  return value.split("\n").map((line) => {
    const [title, description = "", techStack = ""] = line.split("|").map((part) => part.trim());
    return title ? { title, description, techStack } : null;
  }).filter(Boolean);
}

function projectsToText(projects: any[] = []) {
  return projects.map((project) => {
    if (typeof project === "string") return project;
    return [project.title || project.name, project.description, project.techStack || project.technologies].filter(Boolean).join(" | ");
  }).filter(Boolean).join("\n");
}

export default function PortfolioGeneratorPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PortfolioForm>(defaultForm);
  const [context, setContext] = useState("React, Node.js, Express, MongoDB developer working on web apps.");
  const [exportJson, setExportJson] = useState<any>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const portfolios = useQuery({ queryKey: ["portfolios"], queryFn: () => api.get<any[]>("/portfolios"), retry: false });
  const resumesQuery = useQuery({ queryKey: ["resumes"], queryFn: () => api.get<any[]>("/resumes"), retry: false });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: () => api.get<any>("/profile"), retry: false });
  const careerVaultQuery = useQuery({ queryKey: ["career-vault"], queryFn: () => api.get<any[]>("/career-vault"), retry: false });
  const roadmapQuery = useQuery({ queryKey: ["learning-plans"], queryFn: () => api.get<any[]>("/ai/skill-gap/plans"), retry: false });

  const items = portfolios.data || [];
  const careerVaultEntries = useMemo(() => Array.isArray(careerVaultQuery.data) ? careerVaultQuery.data : [], [careerVaultQuery.data]);
  const roadmapPlans = useMemo(() => Array.isArray(roadmapQuery.data) ? roadmapQuery.data : [], [roadmapQuery.data]);
  const selectedPortfolio = items[0];
  const slugCheck = useQuery({
    queryKey: ["portfolio-slug", form.slug, selectedPortfolio?._id],
    queryFn: () => api.get<any>(`/portfolios/slug/${form.slug}${selectedPortfolio?._id ? `?portfolioId=${selectedPortfolio._id}` : ""}`),
    enabled: !slugError && form.slug.length >= 3,
    retry: false
  });
  const hasResume = (resumesQuery.data || []).length > 0;
  const hasProfile = Boolean(profileQuery.data && (profileQuery.data.skills?.length > 0 || profileQuery.data.currentRole || profileQuery.data.headline));
  const hasCareerVault = careerVaultEntries.length > 0;
  const hasRoadmap = roadmapPlans.length > 0;
  const hasData = hasResume || hasProfile || hasCareerVault || hasRoadmap;

  // Auto-seed initial form values if portfolio is empty
  useEffect(() => {
    if (items.length === 0 && (profileQuery.data || resumesQuery.data || careerVaultEntries.length || roadmapPlans.length)) {
      const p = profileQuery.data || {};
      const r = resumesQuery.data?.[0]?.parsedData || {};
      setForm((prev) => ({
        ...prev,
        title: prev.title || `${r.name || p.fullName || "My"} Career Portfolio`,
        displayName: prev.displayName || r.name || p.fullName || "Portfolio Owner",
        headline: prev.headline || p.headline || p.currentRole || "Full-stack developer",
        contactEmail: prev.contactEmail || r.email || p.email || "",
        contactPhone: prev.contactPhone || r.phone || "",
        githubUrl: prev.githubUrl || p.githubUrl || "",
        linkedinUrl: prev.linkedinUrl || p.linkedinUrl || "",
        resumeUrl: prev.resumeUrl || resumesQuery.data?.[0]?.fileUrl || "",
        skillsText: prev.skillsText || [
          ...(r.skills || []),
          ...(p.skills || []),
          ...((roadmapPlans[0]?.prioritySkills || []) as string[])
        ].filter(Boolean).join(", "),
        projectsText: prev.projectsText || projectsToText([
          ...(r.projects || []),
          ...(careerVaultEntries.filter((entry: any) => entry.type === "project").map((entry: any) => ({
            title: entry.title,
            description: entry.description || entry.impact,
            techStack: (entry.skills || []).join(", ")
          })))
        ])
      }));
    }
  }, [profileQuery.data, resumesQuery.data, careerVaultEntries, roadmapPlans, items.length]);

  function portfolioPayload() {
    return {
      slug: form.slug,
      title: form.title,
      displayName: form.displayName,
      headline: form.headline,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      githubUrl: form.githubUrl,
      linkedinUrl: form.linkedinUrl,
      resumeUrl: form.resumeUrl,
      theme: form.theme,
      isPublished: form.isPublished,
      sections: form.sections,
      skills: parseSkills(form.skillsText),
      projects: parseProjects(form.projectsText),
      about: context,
      message: context,
      portfolioContext: context
    };
  }

  const generate = useMutation({
    mutationFn: () => api.post<any>("/portfolios/generate", portfolioPayload()),
    onSuccess: (data) => {
      setExportJson(data);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });

  const update = useMutation({
    mutationFn: (portfolioId: string) => api.patch<any>(`/portfolios/${portfolioId}`, portfolioPayload()),
    onSuccess: (data) => {
      setExportJson(data);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });

  const publish = useMutation({
    mutationFn: (portfolio: any) => api.post<any>(`/portfolios/${portfolio._id}/publish`, {
      isPublished: !portfolio.isPublished,
      sections: portfolio.sections,
      theme: portfolio.theme
    }),
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

  const latestPortfolio = generate.data || items[0];
  const serverSlugError = slugCheck.data && typeof slugCheck.data.available === "boolean" && !slugCheck.data.available ? slugCheck.data.message || "This public slug is already taken." : null;
  const effectiveSlugError = slugError || serverSlugError;
  const saveError = generate.error || update.error || publish.error;

  function publicUrl(slug: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/u/${slug}`;
  }

  function copyPublicUrl(slug: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(publicUrl(slug));
    }
  }

  const handleSlugChange = (val: string) => {
    const slugVal = val.toLowerCase().replace(/\s+/g, "-");
    setForm((prev) => ({ ...prev, slug: slugVal }));
    setSlugError(validateSlugInput(slugVal));
  };

  const loadPortfolioForEditing = (portfolio: any) => {
    setForm({
      slug: portfolio.slug || "",
      title: portfolio.title || `${portfolio.displayName || portfolio.hero || "My"} Career Portfolio`,
      displayName: portfolio.displayName || portfolio.hero || "",
      headline: portfolio.headline || portfolio.hero || "",
      contactEmail: portfolio.contactEmail || "",
      contactPhone: portfolio.contactPhone || "",
      githubUrl: portfolio.githubUrl || "",
      linkedinUrl: portfolio.linkedinUrl || "",
      resumeUrl: portfolio.resumeUrl || "",
      skillsText: (portfolio.skills || []).join(", "),
      projectsText: projectsToText(portfolio.projects || []),
      theme: portfolio.theme || "classic",
      isPublished: Boolean(portfolio.isPublished),
      sections: {
        showEmail: Boolean(portfolio.sections?.showEmail),
        showPhone: Boolean(portfolio.sections?.showPhone),
        showResume: Boolean(portfolio.sections?.showResume),
        showProjects: Boolean(portfolio.sections?.showProjects ?? true),
        showSkills: Boolean(portfolio.sections?.showSkills ?? true),
        showLinks: Boolean(portfolio.sections?.showLinks ?? true),
        showRoadmap: Boolean(portfolio.sections?.showRoadmap)
      }
    });
    setContext(portfolio.about || "");
    setSlugError(null);
  };

  // Safe Empty State Rendering
  if (!hasData && items.length === 0 && !portfolios.isLoading && !resumesQuery.isLoading && !profileQuery.isLoading && !careerVaultQuery.isLoading && !roadmapQuery.isLoading) {
    return (
      <AppShell>
        <PageHeading title="Portfolio generator" description="Create a recruiter-safe public profile with custom privacy controls." />
        <Card className="mx-auto max-w-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Globe2 className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">No profile or resume data found</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                We seed your portfolio with your parsed resume projects, verified skills, and roadmap achievements. Please upload a resume or complete your profile first.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full">
              <Link href="/resume/upload">
                <Button className="w-full sm:w-auto"><Upload className="mr-2 h-4 w-4" /> Upload resume</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full sm:w-auto"><Wrench className="mr-2 h-4 w-4" /> Add skills</Button>
              </Link>
              <Link href="/career-vault">
                <Button variant="outline" className="w-full sm:w-auto">Add projects</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full sm:w-auto">Generate portfolio later</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeading title="Portfolio generator" description="Create a recruiter-safe public profile with publish controls, themes, and exportable content." />

      <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" data-testid="storage-warning">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Storage & Access Notice</p>
            <p className="mt-1 text-xs">Currently running in local storage fallback unless S3/R2 is configured. Generated PDFs can be written to local uploads, which means direct file URLs may be publicly accessible. Durable private storage and signed downloads are provider-ready and require manual setup before production use.</p>
            <p className="mt-1 text-xs">Custom domain portfolio hosting is provider-ready only. This builder creates an app slug at /u/[slug] and does not provision a hosted domain.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.99fr_1.01fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />Builder Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Portfolio Title</label>
                <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="My Full-Stack Developer Portfolio" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
                <Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Portfolio Slug</label>
                <Input value={form.slug} onChange={(event) => handleSlugChange(event.target.value)} placeholder="public-slug-name" />
                {effectiveSlugError ? (
                  <p className="text-xs text-danger" role="alert">{effectiveSlugError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{slugCheck.isFetching ? "Checking slug..." : `URL: /u/${form.slug}`}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Headline</label>
                <Input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} placeholder="e.g. React & Node Developer" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Contact Email</label>
                <Input value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Contact Phone</label>
                <Input value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} placeholder="+1-555-0000" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">GitHub Profile Link</label>
                <Input value={form.githubUrl} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} placeholder="https://github.com/username" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">LinkedIn Profile Link</label>
                <Input value={form.linkedinUrl} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} placeholder="https://linkedin.com/in/username" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Resume PDF URL</label>
                <Input value={form.resumeUrl} onChange={(event) => setForm({ ...form, resumeUrl: event.target.value })} placeholder="https://example.com/resume.pdf" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">About Summary</label>
              <Textarea rows={3} value={context} onChange={(event) => setContext(event.target.value)} placeholder="Explain your core projects, tech stack, and experience." />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Skills</label>
                <Textarea rows={4} value={form.skillsText} onChange={(event) => setForm({ ...form, skillsText: event.target.value })} placeholder="React, Node.js, MongoDB" />
                <p className="text-xs text-muted-foreground">Comma-separated. Seeded from resume/profile/roadmap when available.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Projects</label>
                <Textarea rows={4} value={form.projectsText} onChange={(event) => setForm({ ...form, projectsText: event.target.value })} placeholder={"AI Job Copilot | Full-stack job search system | React, Node.js\nPortfolio Site | Public profile builder | Next.js"} />
                <p className="text-xs text-muted-foreground">One project per line: title | description | tech stack.</p>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase"><Palette className="h-4 w-4" />Theme Selection</p>
              <div className="flex flex-wrap gap-2">
                {(["classic", "compact", "bold"] as const).map((t) => (
                  <Button key={t} type="button" variant={form.theme === t ? "primary" : "outline"} onClick={() => setForm({ ...form, theme: t })}>{t}</Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Privacy & Visibility Controls</p>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showEmail}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showEmail: !form.sections.showEmail } })}
                  />
                  <span>Show contact email</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showPhone}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showPhone: !form.sections.showPhone } })}
                  />
                  <span>Show phone number</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showResume}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showResume: !form.sections.showResume } })}
                  />
                  <span>Show resume download</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showRoadmap}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showRoadmap: !form.sections.showRoadmap } })}
                  />
                  <span>Show learning achievements</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showLinks}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showLinks: !form.sections.showLinks } })}
                  />
                  <span>Show social links</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={() => setForm({ ...form, isPublished: !form.isPublished })}
                  />
                  <span className="font-semibold text-primary">Make portfolio publicly visible</span>
                </label>
              </div>
            </div>

            {saveError ? (
              <p className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger" role="alert">{(saveError as Error).message}</p>
            ) : null}

            <div className="flex gap-2">
              <Button disabled={generate.isPending || !!effectiveSlugError || slugCheck.isFetching} onClick={() => generate.mutate()}><Sparkles className="h-4 w-4" />{generate.isPending ? "Generating..." : "Generate portfolio"}</Button>
              {latestPortfolio && (
                <Button variant="outline" disabled={update.isPending || !!effectiveSlugError || slugCheck.isFetching} onClick={() => update.mutate(latestPortfolio._id || latestPortfolio.id)}>{update.isPending ? "Saving Edits..." : "Save Edits"}</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Globe2 className="h-4 w-4" />Portfolio Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {latestPortfolio ? (
              <>
                <div className="rounded-md border p-4 bg-muted/20 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{latestPortfolio.theme || "classic"}</Badge>
                    <Badge className={latestPortfolio.isPublished ? "bg-primary text-primary-foreground" : ""}>{latestPortfolio.isPublished ? "Published" : "Private/Hidden"}</Badge>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{latestPortfolio.title || "Career Portfolio"}</p>
                  <h2 className="text-xl font-bold">{latestPortfolio.displayName || latestPortfolio.hero || "Your Portfolio"}</h2>
                  <p className="text-sm font-semibold text-primary">{latestPortfolio.headline || "Full-stack developer"}</p>
                  <p className="text-sm text-muted-foreground">{latestPortfolio.about || "Portfolio summary details will appear here."}</p>
                  <p className="text-xs text-muted-foreground font-mono">{latestPortfolio.slug}</p>

                  {latestPortfolio.skills?.length ? (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {latestPortfolio.skills.map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => publish.mutate(latestPortfolio)}>{latestPortfolio.isPublished ? "Unpublish" : "Publish to Web"}</Button>
                  <Button variant="outline" onClick={() => copyPublicUrl(latestPortfolio.publicProfile?.slug || latestPortfolio.slug)}><Copy className="h-4 w-4" />Copy URL</Button>
                  <Link href={`/u/${latestPortfolio.publicProfile?.slug || latestPortfolio.slug}`} target="_blank" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"><Eye className="h-4 w-4" />Preview Public Portfolio</Link>
                  <Button variant="outline" onClick={() => setExportJson(latestPortfolio)}><FileJson className="h-4 w-4" />Export JSON</Button>
                  <Button
                    variant="outline"
                    disabled={generatePdf.isPending}
                    onClick={() => generatePdf.mutate(latestPortfolio._id || latestPortfolio.id)}
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
              <div className="rounded-md border p-5 text-sm text-muted-foreground text-center">No portfolio generated yet. Complete the builder form and click Generate portfolio.</div>
            )}
            {exportJson ? <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(exportJson, null, 2)}</pre> : null}
          </CardContent>
        </Card>
      </div>

      {items.length > 1 && (
        <div className="mt-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Saved Portfolios</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((portfolio: any) => (
              <Card key={portfolio._id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => loadPortfolioForEditing(portfolio)}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold truncate">{portfolio.displayName || portfolio.hero || portfolio.slug}</h3>
                    <Badge className={portfolio.isPublished ? "bg-primary text-primary-foreground" : ""}>{portfolio.isPublished ? "Published" : "Private"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">/u/{portfolio.slug}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-8 px-3 text-xs" onClick={(e) => { e.stopPropagation(); publish.mutate(portfolio); }}>{portfolio.isPublished ? "Unpublish" : "Publish"}</Button>
                    <Button variant="ghost" className="h-8 px-3 text-xs" onClick={(e) => { e.stopPropagation(); setExportJson(portfolio); }}>JSON</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
