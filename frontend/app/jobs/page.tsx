"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Filter, PlusCircle, Search, Sparkles, X, RefreshCw, Clock } from "lucide-react";
import { useMemo, useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { JobCard } from "@/components/jobs/job-card";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState, RetryButton } from "@/components/shared/status-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const fromResume = searchParams.get("fromResume");

  const [search, setSearch] = useState(() => searchParams.get("role") || searchParams.get("search") || "");
  const [remoteType, setRemoteType] = useState("");
  const [jobType, setJobType] = useState("");
  const [trustMin, setTrustMin] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [experience, setExperience] = useState("");
  const [sort, setSort] = useState(fromResume ? "match" : "postedAt");
  const [hideApplied, setHideApplied] = useState(true);
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const [refreshMessage, setRefreshMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (debounced) params.set("search", debounced);
    if (remoteType) params.set("remoteType", remoteType);
    if (jobType) params.set("jobType", jobType);
    if (trustMin) params.set("trustMin", trustMin);
    if (salaryMin) params.set("salaryMin", salaryMin);
    if (experience) params.set("experience", experience);
    if (sort) params.set("sort", sort);
    params.set("hideApplied", hideApplied ? "true" : "false");
    if (fromResume) params.set("fromResume", fromResume);
    params.set("page", String(page));
    return params.toString();
  }, [debounced, experience, jobType, remoteType, salaryMin, sort, trustMin, hideApplied, fromResume, page]);

  const jobs = useQuery({ queryKey: ["jobs", query], queryFn: () => api.get<any>("/jobs" + (query ? "?" + query : "")), retry: false });
  const sources = useQuery({ queryKey: ["job-sources"], queryFn: () => api.get<any>("/jobs/sources"), retry: false });
  const applications = useQuery({ queryKey: ["applications"], queryFn: () => api.get<any[]>("/applications"), retry: false });
  const syncStatus = useQuery({ queryKey: ["sync-status"], queryFn: () => api.get<any>("/jobs/sync-status"), retry: false });

  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [timeAgoText, setTimeAgoText] = useState("just now");

  useEffect(() => {
    if (!syncStatus.data?.lastSyncedAt) return;
    
    function updateText() {
      const diffMs = Date.now() - new Date(syncStatus.data.lastSyncedAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) {
        setTimeAgoText("just now");
      } else {
        setTimeAgoText(`${diffMins} minute${diffMins > 1 ? "s" : ""} ago`);
      }
    }
    
    updateText();
    const interval = setInterval(updateText, 10000);
    return () => clearInterval(interval);
  }, [syncStatus.data?.lastSyncedAt]);

  useEffect(() => {
    if (syncStatus.data?.cooldownRemainingMs) {
      setCooldownTimeLeft(Math.ceil(syncStatus.data.cooldownRemainingMs / 1000));
    }
  }, [syncStatus.data?.cooldownRemainingMs]);

  useEffect(() => {
    if (cooldownTimeLeft > 0) {
      const timer = setTimeout(() => {
        setCooldownTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTimeLeft]);

  useEffect(() => {
    if (jobs.isSuccess) {
      api.post("/jobs/viewed").catch(() => {});
    }
  }, [jobs.isSuccess]);

  useEffect(() => {
    setPage(1);
  }, [debounced, remoteType, jobType, experience, trustMin, salaryMin, sort, hideApplied, fromResume]);

  const refreshMutation = useMutation({
    mutationFn: () => api.post<any>("/jobs/refresh"),
    onMutate: () => {
      setIsRefreshing(true);
      setRefreshMessage("Searching for fresh jobs...");
    },
    onSuccess: (res: any) => {
      setIsRefreshing(false);
      const data = res?.data || {};
      if (data.cooldownRemainingMs > 0 && data.newJobsCount === 0) {
        setRefreshMessage(data.message || "Refresh cooldown active. Feed is already up-to-date.");
      } else {
        setRefreshMessage(data.newJobsCount > 0 ? `${data.newJobsCount} new jobs found!` : "No new jobs found. Feed is up-to-date.");
      }
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      void qc.invalidateQueries({ queryKey: ["sync-status"] });
      setTimeout(() => setRefreshMessage(""), 5000);
    },
    onError: (err: any) => {
      setIsRefreshing(false);
      setRefreshMessage(err instanceof Error ? err.message : "Refresh failed.");
      setTimeout(() => setRefreshMessage(""), 5000);
    }
  });

  const handleRefresh = () => {
    if (cooldownTimeLeft > 0 || isRefreshing) return;
    refreshMutation.mutate();
  };

  const resumeQuery = useQuery({
    queryKey: ["resume", fromResume],
    queryFn: () => api.get<any>("/resumes/" + fromResume),
    enabled: !!fromResume,
    retry: false
  });

  const resumeSkills = useMemo(() => {
    return (resumeQuery.data?.parsedData?.skills || []).map((s: string) => s.toLowerCase());
  }, [resumeQuery.data]);

  const savedJobIds = useMemo(() => {
    const list = Array.isArray(applications.data)
      ? applications.data
      : Array.isArray((applications.data as any)?.items)
      ? (applications.data as any).items
      : [];
    return list.filter((a: any) => a.status === "Saved").map((a: any) => String(a.jobId));
  }, [applications.data]);

  const appliedJobIds = useMemo(() => {
    const list = Array.isArray(applications.data)
      ? applications.data
      : Array.isArray((applications.data as any)?.items)
      ? (applications.data as any).items
      : [];
    return list.filter((a: any) => a.status !== "Saved").map((a: any) => String(a.jobId));
  }, [applications.data]);

  const items = jobs.data?.items || [];

  const processedItems = useMemo(() => {
    if (!fromResume || !resumeSkills.length) return items;
    
    return items.map((job: any) => {
      const jobSkills = (job.skillsRequired || []).map((s: string) => s.toLowerCase());
      const matched = jobSkills.filter((s: string) => resumeSkills.includes(s));
      const matchScore = jobSkills.length 
        ? Math.round((matched.length / jobSkills.length) * 100) 
        : 0;
      
      const strongFitSkills = Array.from(new Set([
        ...(job.strongFitSkills || []),
        ...matched.map((s: string) => (job.skillsRequired || []).find((x: string) => x.toLowerCase() === s))
      ].filter(Boolean))) as string[];

      const missingSkills = (job.skillsRequired || []).filter(
        (s: string) => !resumeSkills.includes(s.toLowerCase())
      );

      return {
        ...job,
        matchScore: job.matchScore || matchScore,
        strongFitSkills,
        missingSkills,
        whyMatched: job.whyMatched || (matchScore > 0 ? `Matched ${matched.length} skill${matched.length > 1 ? "s" : ""} from your resume "${resumeQuery.data?.fileName}".` : "")
      };
    });
  }, [items, fromResume, resumeSkills, resumeQuery.data]);

  const newJobsCount = useMemo(() => {
    return processedItems.filter((job: any) => job.isNew).length;
  }, [processedItems]);

  const total = jobs.data?.total || 0;
  const limit = jobs.data?.limit || 20;
  const totalPages = Math.ceil(total / limit);
  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  const handleClearResumeFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("fromResume");
    router.push("/jobs" + (params.toString() ? "?" + params.toString() : ""));
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <PageHeading title="Jobs" description="Search, filter, save, analyze, and open official job links. AI match and trust score help you decide before applying." />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || refreshMutation.isPending || cooldownTimeLeft > 0}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing || refreshMutation.isPending ? "animate-spin" : ""}`} />
            {isRefreshing || refreshMutation.isPending 
              ? "Refreshing..." 
              : cooldownTimeLeft > 0 
              ? `Refresh (${cooldownTimeLeft}s)` 
              : "Refresh Jobs"}
          </Button>
          <Button onClick={() => router.push("/jobs/import")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Import job
          </Button>
        </div>
      </div>

      {/* Sync status indicator */}
      {(syncStatus.data?.lastSyncedAt || refreshMessage) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {syncStatus.data?.lastSyncedAt
                ? `Last synced: ${timeAgoText}`
                : "Not synced recently"}
              {syncStatus.data?.status && (
                <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  syncStatus.data.status === "success"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : syncStatus.data.status === "failed"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                }`}>
                  {syncStatus.data.status}
                </span>
              )}
              {syncStatus.data?.cooldownRemainingMs > 0 && cooldownTimeLeft > 0 && (
                <span className="ml-2 rounded bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
                  Cooldown active ({cooldownTimeLeft}s remaining)
                </span>
              )}
            </span>
          </div>
          {refreshMessage && (
            <div className="flex items-center gap-1 font-semibold text-primary animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{refreshMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Resume context match banner */}
      {fromResume && resumeQuery.data && (
        <div className="mb-5 rounded-md border border-violet-200 bg-violet-50/50 p-4 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600 animate-pulse shrink-0" />
            <div>
              <p className="font-semibold">Matching jobs to resume: <span className="underline">{resumeQuery.data.fileName}</span></p>
              <p className="text-xs text-muted-foreground">{resumeSkills.length} skills parsed from resume.</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleClearResumeFilter} className="h-8 w-8 p-0" aria-label="Clear resume filter">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="mb-5 grid gap-3 rounded-md border bg-card p-3 lg:grid-cols-[1fr_130px_130px_130px_130px_130px_130px]">
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
          <option value="Contract">Contract</option>
          <option value="Part-time">Part-time</option>
        </select>
        <select aria-label="Experience level filter" className="h-10 rounded-md border bg-background px-3 text-sm" value={experience} onChange={(event) => setExperience(event.target.value)}>
          <option value="">Any experience</option>
          <option value="fresher">Fresher / 0-1 yr</option>
          <option value="junior">Junior / 1-3 yrs</option>
          <option value="mid">Mid / 3-5 yrs</option>
          <option value="senior">Senior / 5+ yrs</option>
        </select>
        <select aria-label="Minimum trust score filter" className="h-10 rounded-md border bg-background px-3 text-sm" value={trustMin} onChange={(event) => setTrustMin(event.target.value)}>
          <option value="">Any trust</option>
          <option value="70">70+ trust</option>
          <option value="80">80+ trust</option>
          <option value="90">90+ trust</option>
        </select>
        <select aria-label="Minimum salary filter" className="h-10 rounded-md border bg-background px-3 text-sm" value={salaryMin} onChange={(event) => setSalaryMin(event.target.value)}>
          <option value="">Any salary</option>
          <option value="300000">3 LPA+</option>
          <option value="600000">6 LPA+</option>
          <option value="900000">9 LPA+</option>
          <option value="1500000">15 LPA+</option>
        </select>
        <select aria-label="Sort jobs" className="h-10 rounded-md border bg-background px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="match">AI match score</option>
          <option value="postedAt">Newest</option>
          <option value="trust">Trust score</option>
          <option value="salary">Salary</option>
          <option value="scamRisk">Lowest scam risk</option>
        </select>
      </div>

      {sources.data ? (
        <div className="mb-5 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          Provider-ready sources: {(sources.data.externalProviders || []).map((source: any) => source.name).join(", ")}. Live board search requires approved API or partner-feed credentials; protected scraping and auto-apply are disabled.
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span aria-live="polite">
            {jobs.isLoading 
              ? "Loading jobs..." 
              : total > 0 
              ? `Showing ${startIdx}–${endIdx} of ${total} jobs` 
              : "0 jobs found"}
          </span>
          {newJobsCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {newJobsCount} new job{newJobsCount > 1 ? "s" : ""} since last visit
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer font-medium select-none text-xs">
          <input 
            type="checkbox" 
            className="rounded border-input text-primary focus:ring-ring focus:ring-offset-2" 
            checked={hideApplied} 
            onChange={(e) => setHideApplied(e.target.checked)} 
          />
          Hide jobs I've already applied to
        </label>
      </div>

      {jobs.isLoading ? <LoadingState title="Loading normalized jobs" description="Fetching curated, deduplicated, and trust-scored jobs for this search." /> : null}
      {jobs.isError ? <ErrorState description={jobs.error instanceof Error ? jobs.error.message : "Could not load jobs."} action={<RetryButton onClick={() => jobs.refetch()} />} /> : null}
      {!jobs.isLoading && !jobs.isError && !processedItems.length ? (
        <EmptyState
          title="No jobs match these filters yet"
          description="Try a broader role, remove a trust filter, or check the daily feed for curated fresher-friendly roles."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {processedItems.map((job: any) => (
          <JobCard
            key={job._id}
            job={job}
            isSaved={savedJobIds.includes(String(job._id))}
            isApplied={appliedJobIds.includes(String(job._id))}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2 border-t pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPage((p) => Math.max(p - 1, 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPage((p) => Math.min(p + 1, totalPages));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

export default function JobsPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState title="Loading job feed" description="Preparing curated job list and matching algorithms..." />}>
        <JobsContent />
      </Suspense>
    </AppShell>
  );
}
