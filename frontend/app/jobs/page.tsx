"use client";

import { useQuery } from "@tanstack/react-query";
import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { JobCard } from "@/components/jobs/job-card";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [remoteType, setRemoteType] = useState("");
  const [jobType, setJobType] = useState("");
  const [trustMin, setTrustMin] = useState("");
  const debounced = useDebounce(search);
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (debounced) params.set("search", debounced);
    if (remoteType) params.set("remoteType", remoteType);
    if (jobType) params.set("jobType", jobType);
    if (trustMin) params.set("trustMin", trustMin);
    return params.toString();
  }, [debounced, jobType, remoteType, trustMin]);
  const jobs = useQuery({ queryKey: ["jobs", query], queryFn: () => api.get<any>("/jobs" + (query ? "?" + query : "")), retry: false });
  const items = jobs.data?.items || [];
  return (
    <AppShell>
      <PageHeading title="Jobs" description="Search, filter, save, analyze, and open official job links. AI match and trust score help you decide before applying." />
      <div className="mb-5 grid gap-3 rounded-md border bg-card p-3 lg:grid-cols-[1fr_180px_180px_160px]">
        <div className="flex items-center gap-2 rounded-md border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input aria-label="Search jobs" className="border-0 focus:ring-0" placeholder="Search role, company, skill, location" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Workplace filter" className="h-10 rounded-md border bg-background px-3 text-sm" value={remoteType} onChange={(event) => setRemoteType(event.target.value)}>
          <option value="">Any workplace</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Onsite">Onsite</option>
        </select>
        <select aria-label="Job type filter" className="h-10 rounded-md border bg-background px-3 text-sm" value={jobType} onChange={(event) => setJobType(event.target.value)}>
          <option value="">Any type</option>
          <option value="Full-time">Full-time</option>
          <option value="Internship">Internship</option>
        </select>
        <select aria-label="Minimum trust score filter" className="h-10 rounded-md border bg-background px-3 text-sm" value={trustMin} onChange={(event) => setTrustMin(event.target.value)}>
          <option value="">Any trust</option>
          <option value="70">70+ trust</option>
          <option value="80">80+ trust</option>
          <option value="90">90+ trust</option>
        </select>
      </div>
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span aria-live="polite">{jobs.isLoading ? "Loading jobs..." : `${items.length} of ${jobs.data?.total || 0} normalized jobs shown`}</span>
      </div>
      {jobs.isLoading ? <LoadingState title="Loading normalized jobs" description="Fetching curated, deduplicated, and trust-scored jobs for this search." /> : null}
      {jobs.isError ? <ErrorState description={jobs.error instanceof Error ? jobs.error.message : "Could not load jobs."} action={<RetryButton onClick={() => jobs.refetch()} />} /> : null}
      {!jobs.isLoading && !jobs.isError && !items.length ? (
        <EmptyState
          title="No jobs match these filters yet"
          description="Try a broader role, remove a trust filter, or check the daily feed for curated fresher-friendly roles."
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">{items.map((job: any) => <JobCard key={job._id} job={job} />)}</div>
    </AppShell>
  );
}
