"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export default function JobImportPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("Remote");
  const [remoteType, setRemoteType] = useState("Remote");
  const [jobType, setJobType] = useState("Full-time");
  const [applyUrl, setApplyUrl] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");

  const [showForm, setShowForm] = useState(false);

  // AI/Heuristic text parser mutation
  const parseMutation = useMutation({
    mutationFn: (text: string) => api.post<any>("/jobs/parse-text", { text }),
    onSuccess: (res: any) => {
      const data = res.data || {};
      setTitle(data.title || "");
      setCompany(data.company || "");
      setLocation(data.location || "Remote");
      setRemoteType(data.remoteType || "Remote");
      setJobType(data.jobType || "Full-time");
      setApplyUrl(data.applyUrl || "");
      setSalaryMin(data.salaryMin ? String(data.salaryMin) : "");
      setSalaryMax(data.salaryMax ? String(data.salaryMax) : "");
      setSkillsRequired(Array.isArray(data.skillsRequired) ? data.skillsRequired.join(", ") : "");
      setDescription(data.description || "");
      setResponsibilities(Array.isArray(data.responsibilities) ? data.responsibilities.join("\n") : "");
      setRequirements(Array.isArray(data.requirements) ? data.requirements.join("\n") : "");
      setShowForm(true);
    }
  });

  // Debounced duplicate checker query
  const duplicateQuery = useQuery({
    queryKey: ["dup-check", title, company],
    queryFn: () => {
      const q = new URLSearchParams();
      q.set("company", company);
      q.set("search", title);
      return api.get<any>("/jobs?" + q.toString());
    },
    enabled: !!(title.trim().length > 2 && company.trim().length > 2)
  });

  const hasDuplicate = duplicateQuery.data?.items?.some((item: any) => {
    const normTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const normCompany = company.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return item.normalizedTitle === normTitle && item.normalizedCompany === normCompany;
  });

  // Save manual import mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/jobs/manual-import", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      router.push("/jobs");
    }
  });

  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    parseMutation.mutate(rawText);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      company,
      location,
      remoteType,
      jobType,
      applyUrl,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      skillsRequired: skillsRequired.split(",").map(s => s.trim()).filter(Boolean),
      description,
      responsibilities: responsibilities.split("\n").map(r => r.trim()).filter(Boolean),
      requirements: requirements.split("\n").map(r => r.trim()).filter(Boolean),
      source: "Manual import",
      sourceType: "manual"
    };
    saveMutation.mutate(payload);
  };

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/jobs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
      </div>

      <PageHeading
        title="Manual job import"
        description="Paste a job description or portal link. Our parser extracts the structural fields so you can edit and save them cleanly."
      />

      <div className="grid gap-6">
        {/* Paste Box */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Paste job URL or text description</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleParse} className="space-y-4">
              <Textarea
                placeholder="Paste job posting text details or apply link here (e.g. Lever, Greenhouse, careers pages)..."
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <Button type="submit" disabled={parseMutation.isPending} className="w-full sm:w-auto">
                {parseMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Parsing job details...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Parse details
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Edit and Verify Form */}
        {showForm && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Duplicate Check Alert */}
            {hasDuplicate && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Duplicate job posting detected</h4>
                  <p className="mt-1">A job listing for <span className="underline font-semibold">{title}</span> at <span className="underline font-semibold">{company}</span> already exists. You can still import it, but it may create a duplicate entry in your feed.</p>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Role details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Job Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Company</label>
                    <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">Workplace Type</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={remoteType}
                        onChange={(e) => setRemoteType(e.target.value)}
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Onsite">Onsite</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">Job Type</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Location</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Apply Link (Official URL)</label>
                    <Input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="https://company.com/apply" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">Min Salary (Annual)</label>
                      <Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="e.g. 400000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">Max Salary (Annual)</label>
                      <Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="e.g. 800000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Required Skills (Comma separated)</label>
                    <Input value={skillsRequired} onChange={(e) => setSkillsRequired(e.target.value)} placeholder="React, Node.js, TypeScript" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Description & checklists</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Job Summary Description</label>
                    <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Responsibilities (One bullet per line)</label>
                    <Textarea rows={6} value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} placeholder="Design React components&#10;Implement backend APIs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Requirements (One bullet per line)</label>
                    <Textarea rows={6} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="1+ years React experience&#10;Solid JavaScript knowledge" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving job...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Import & save role
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
