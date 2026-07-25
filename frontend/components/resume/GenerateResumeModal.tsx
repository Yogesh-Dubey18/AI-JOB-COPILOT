"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Sparkles, Download, CheckCircle, ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface GenerateResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
}

export function GenerateResumeModal({ open, onOpenChange, job }: GenerateResumeModalProps) {
  const qc = useQueryClient();
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [tracked, setTracked] = useState(false);

  // Fetch user's uploaded resumes
  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: () => api.get<any[]>("/resumes"),
    enabled: open
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post<any>("/resumes/generate-for-job", {
      resumeId: selectedResumeId,
      jobId: job._id
    }),
    onSuccess: (res) => {
      setSuccessData(res.data || res);
      toast.success("Resume tailored successfully! 🎯");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate resume");
    }
  });

  const trackMutation = useMutation({
    mutationFn: () => api.post("/applications", {
      jobId: job._id,
      company: job.company,
      role: job.title,
      status: "Applied"
    }),
    onSuccess: () => {
      setTracked(true);
      void qc.invalidateQueries({ queryKey: ["applications"] });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job added to your tracker!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save application");
    }
  });

  if (!open) return null;

  const resumes = resumesQuery.data || [];

  const handleGenerate = () => {
    if (!selectedResumeId) {
      toast.error("Please select a base resume first");
      return;
    }
    generateMutation.mutate();
  };

  const handleDownload = () => {
    if (!successData?.pdfUrl) return;
    
    // Trigger download
    const link = document.createElement("a");
    link.href = successData.pdfUrl;
    const safeTitle = (job.title || "Target_Role").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `Resume_${safeTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Resume downloaded! Good luck with your application at ${job.company} 🎯`);
  };

  const handleTrack = () => {
    trackMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border rounded-lg shadow-lg p-6 space-y-4 max-h-[95vh] overflow-y-auto transform transition-all animate-in zoom-in-95 duration-200 text-card-foreground">
        
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="space-y-1 pr-6">
          <h2 className="text-xl font-bold tracking-tight text-teal-700 dark:text-teal-400">
            Generate resume for {job.title}
          </h2>
          <p className="text-sm text-muted-foreground font-semibold">
            at {job.company}
          </p>
        </div>

        {generateMutation.isPending ? (
          /* Loading State */
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse text-center">
              Crafting your perfect resume for {job.title} at {job.company}...
            </p>
          </div>
        ) : successData ? (
          /* Success Result State */
          <div className="space-y-5">
            {/* ATS Score Comparison */}
            <div className="space-y-3 p-4 bg-muted/40 rounded-lg border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">ATS Score Comparison</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Original Resume Score</span>
                    <span>{successData.beforeAtsScore}%</span>
                  </div>
                  <Progress value={successData.beforeAtsScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-teal-600 dark:text-teal-400">Tailored Resume Score</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">{successData.atsScore}%</span>
                  </div>
                  <Progress value={successData.atsScore} className="h-2 bg-teal-100 dark:bg-teal-950/40 [&>div]:bg-teal-600" />
                </div>
              </div>
            </div>

            {/* Added Keywords */}
            {successData.addedKeywords && successData.addedKeywords.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Injected ATS Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {successData.addedKeywords.map((kw: string) => (
                    <Badge key={kw} className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Preview key sections */}
            <div className="border rounded-lg p-4 bg-card max-h-40 overflow-y-auto space-y-3 text-xs">
              <h4 className="font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">World-Class Tailored Summary</h4>
              <p className="text-muted-foreground leading-relaxed italic">"{successData.generatedResume?.summary}"</p>
              
              <h4 className="font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mt-2">Skills Preview</h4>
              <p className="text-muted-foreground">
                <span className="font-bold text-foreground">Frontend:</span> {successData.generatedResume?.skills?.frontend?.join(", ")}
              </p>
              <p className="text-muted-foreground">
                <span className="font-bold text-foreground">Backend:</span> {successData.generatedResume?.skills?.backend?.join(", ")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleDownload}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5"
              >
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button
                onClick={handleTrack}
                disabled={tracked || trackMutation.isPending}
                variant="outline"
                className="w-full font-semibold border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
              >
                {tracked ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Job added to your tracker
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" /> Save & Track Application
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Initial Configuration State */
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="base-resume" className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
                Select your base resume
              </label>
              {resumesQuery.isPending ? (
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              ) : resumes.length === 0 ? (
                <div className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                  No uploaded resumes found. Please go to the Upload page to upload your base resume first.
                </div>
              ) : (
                <select
                  id="base-resume"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Choose a resume --</option>
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fileName || "Unnamed Resume"} ({new Date(r.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={resumes.length === 0 || !selectedResumeId}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 mt-2"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Generate World-Class Resume
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
