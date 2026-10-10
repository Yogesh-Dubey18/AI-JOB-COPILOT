"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

async function fetchMatchedJobs() {
  const token = typeof window !== "undefined" ? localStorage.getItem("ai_job_copilot_token") : null;
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch("/api/jobs/matched", { credentials: "include", headers });
  if (!res.ok) throw new Error("Failed to fetch matched jobs");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
}

export function DashboardJobFeed() {
  const { data: rawJobs, isLoading, error } = useQuery({
    queryKey: ["matchedJobs"],
    queryFn: fetchMatchedJobs,
  });

  const jobs = Array.isArray(rawJobs) ? rawJobs : [];

  const handleTailorAndExport = async (jobId: string) => {
    const toastId = toast.loading("Tailoring resume and generating ATS PDF...");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("ai_job_copilot_token") : null;
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/jobs/${jobId}/tailor`, { method: "POST", credentials: "include", headers });
      if (!res.ok) throw new Error("Tailoring failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Yogesh_Dubey_Resume_${jobId}.pdf`;
      a.click();
      toast.dismiss(toastId);
      toast.success("ATS PDF Resume generated successfully!");
    } catch {
      toast.dismiss(toastId);
      toast.error("Error generating tailored resume.");
    }
  };

  if (isLoading) return <div className="p-6 text-center text-brand-orange">Loading your daily matched jobs...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Failed to load job feed.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily AI Job Feed</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job: any) => (
          <div key={job.id} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  job.matchScore >= 85 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {job.matchScore}% Match
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{job.company} • {job.location}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.missingSkills?.map((skill: string, idx: number) => (
                  <span key={idx} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded">
                    Missing: {skill}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleTailorAndExport(job.id)}
              className="w-full bg-[#EF6637] hover:bg-[#d8552b] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Tailor Resume & Export PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardJobFeed;
