"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { JobCard } from "@/components/jobs/job-card";
import { PageHeading } from "@/components/shared/page-heading";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const jobs = useQuery({ queryKey: ["jobs", debounced], queryFn: () => api.get<any>("/jobs?search=" + encodeURIComponent(debounced)), retry: false });
  return (
    <AppShell>
      <PageHeading title="Jobs" description="Search, filter, save, analyze, and open official job links. AI match and trust score help you decide before applying." />
      <div className="mb-5 flex items-center gap-2 rounded-md border bg-card px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input className="border-0 focus:ring-0" placeholder="Search role, company, skill, location" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {jobs.isLoading ? <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div> : null}
      <div className="grid gap-4 md:grid-cols-2">{(jobs.data?.items || []).map((job: any) => <JobCard key={job._id} job={job} />)}</div>
    </AppShell>
  );
}
