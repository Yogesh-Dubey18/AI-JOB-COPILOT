"use client";

import React, { useState, useEffect, type DragEvent } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const COLUMNS = ["Discovered", "Tailored", "Applied", "Interviewing"];

function normalizeStatus(status?: string): string {
  if (!status) return "Discovered";
  const s = status.toLowerCase();
  if (s.includes("interview") || s.includes("round") || s.includes("technical") || s.includes("hr")) return "Interviewing";
  if (s.includes("tailor")) return "Tailored";
  if (s.includes("apply") || s.includes("applied") || s.includes("submit")) return "Applied";
  return "Discovered";
}

export interface KanbanBoardProps {
  initialJobs?: any[];
  applications?: any[];
}

export function KanbanBoard({ initialJobs, applications }: KanbanBoardProps) {
  const qc = useQueryClient();
  const rawList = initialJobs || applications || [];

  const [jobs, setJobs] = useState<any[]>(() => {
    return rawList.map((item) => ({
      ...item,
      id: String(item.id || item._id || ""),
      title: item.title || item.role || item.jobTitle || "Software Engineer",
      company: item.company || "Company",
      status: item.status && COLUMNS.includes(item.status) ? item.status : normalizeStatus(item.status),
      matchScore: item.matchScore ?? 85,
    }));
  });

  useEffect(() => {
    const list = initialJobs || applications || [];
    setJobs(
      list.map((item) => ({
        ...item,
        id: String(item.id || item._id || ""),
        title: item.title || item.role || item.jobTitle || "Software Engineer",
        company: item.company || "Company",
        status: item.status && COLUMNS.includes(item.status) ? item.status : normalizeStatus(item.status),
        matchScore: item.matchScore ?? 85,
      }))
    );
  }, [initialJobs, applications]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch("/applications/" + id + "/status", { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["applications"] });
      void qc.invalidateQueries({ queryKey: ["application-insights"] });
    },
  });

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("job/id", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, col: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("job/id");
    if (!id) return;

    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, status: col } : job))
    );

    if (applications) {
      updateStatusMutation.mutate({ id, status: col });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
      {COLUMNS.map((col) => {
        const columnJobs = jobs.filter((j) => j.status === col);
        return (
          <div
            key={col}
            className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col h-[75vh]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{col}</h3>
              <span className="text-xs bg-card px-2 py-0.5 rounded-full border border-border font-medium text-muted-foreground">
                {columnJobs.length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {columnJobs.length === 0 ? (
                <div className="h-24 rounded-lg border border-dashed border-border/70 flex items-center justify-center text-xs text-muted-foreground/80">
                  Drop roles here
                </div>
              ) : null}
              {columnJobs.map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, job.id)}
                  className="bg-card border border-border p-3 rounded-lg shadow-2xs space-y-2 cursor-grab active:cursor-grabbing hover:border-border/80 transition-shadow"
                >
                  <Link href={`/jobs/${job.id}`} className="hover:underline block">
                    <h4 className="font-medium text-sm text-foreground">{job.title}</h4>
                  </Link>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-border/50">
                    <span className="text-[#EF6637] font-semibold">{job.matchScore}% Match</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{col}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KanbanBoard;
