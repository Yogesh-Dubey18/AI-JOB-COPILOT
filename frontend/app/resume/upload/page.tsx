"use client";

import { useMutation } from "@tanstack/react-query";
import { Linkedin, Save, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const RESUME_TYPES = [".pdf", ".docx", ".txt"];

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [anonymizePreview, setAnonymizePreview] = useState(false);
  const [draftSummary, setDraftSummary] = useState("");
  const [draftSkills, setDraftSkills] = useState("");
  const upload = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      if (file) data.append("resume", file);
      data.append("isBaseResume", "true");
      data.append("anonymizePreview", String(anonymizePreview));
      return api.post<any>("/resumes/upload", data);
    },
    onSuccess: () => {
      toast.success("Resume uploaded and parsed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload resume.");
    }
  });
  const saveParsedData = useMutation({
    mutationFn: async () => api.patch<any>("/resumes/" + upload.data?._id + "/parsed-data", {
      parsedData: {
        summary: draftSummary,
        skills: draftSkills.split(",").map((skill) => skill.trim()).filter(Boolean)
      }
    }),
    onSuccess: () => {
      toast.success("Parsed resume edits saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save parsed edits.");
    }
  });

  useEffect(() => {
    if (!upload.data?.parsedData) return;
    setDraftSummary(upload.data.parsedData.summary || "");
    setDraftSkills((upload.data.parsedData.skills || []).join(", "));
  }, [upload.data]);

  const handleFile = (selected: File | null) => {
    setFileError("");
    setFile(null);
    if (!selected) return;
    const isAllowed = RESUME_TYPES.some((extension) => selected.name.toLowerCase().endsWith(extension));
    if (!isAllowed) {
      setFileError("Upload a PDF, DOCX, or TXT resume file.");
      return;
    }
    if (selected.size > MAX_RESUME_SIZE) {
      setFileError("Resume file must be 5 MB or smaller.");
      return;
    }
    setFile(selected);
  };
  return (
    <AppShell>
      <PageHeading title="Resume upload" description="Upload PDF, DOCX, or TXT. The backend validates type and size, extracts text, parses key sections, and saves a base resume." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Upload base resume</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input aria-label="Resume file" type="file" accept=".pdf,.docx,.txt" onChange={(event) => handleFile(event.target.files?.[0] || null)} />
            <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
              <input className="mt-1" type="checkbox" checked={anonymizePreview} onChange={(event) => setAnonymizePreview(event.target.checked)} />
              <span>
                <span className="block font-medium">Generate anonymized preview</span>
                <span className="text-muted-foreground">Redacts name, email, phone, and links in the preview used for bias-aware analysis review.</span>
              </span>
            </label>
            {fileError ? <p role="alert" className="text-sm text-danger">{fileError}</p> : null}
            <Button type="button" disabled={!file || upload.isPending} onClick={() => upload.mutate()} aria-busy={upload.isPending}><Upload className="h-4 w-4" /> {upload.isPending ? "Uploading..." : "Upload resume"}</Button>
            {file ? <p className="text-sm text-muted-foreground">{file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB</p> : null}
            {upload.isError ? <ErrorState description={upload.error instanceof Error ? upload.error.message : "Could not upload resume."} /> : null}
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium"><Linkedin className="h-4 w-4" /> LinkedIn import</div>
              <p className="mt-1 text-muted-foreground">Provider-ready only. Enable official LinkedIn OAuth credentials before importing profile data. No scraping or credential collection is used.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-4" data-testid="upload-guide">
          <CardHeader>
            <CardTitle>Resume Upload Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>To ensure high-accuracy parsing and best ATS matching results, please follow these guidelines:</p>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
              <li><strong>Supported Formats:</strong> Only PDF and DOCX files are officially supported.</li>
              <li><strong>File Size Limit:</strong> Maximum allowed file size is 5MB.</li>
              <li><strong>Use Text-Based PDFs:</strong> Do not upload image-only or scanned PDFs. The parser extracts text content directly.</li>
              <li><strong>Recommended Sections:</strong> Ensure your resume explicitly includes: <em>Summary, Skills, Projects, Experience, Education,</em> and <em>Links</em> (GitHub/LinkedIn).</li>
              <li><strong>Anonymize/Redact Mode:</strong> Enabling this mode redacts personally identifiable information (name, email, phone, links) in the preview. It protects your privacy when sharing resumes with external AI APIs.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Parsed preview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upload.isPending ? <LoadingState title="Parsing resume" description="Extracting text and identifying skills, links, education, and projects." /> : null}
            {!upload.isPending && !upload.data?.parsedData ? <EmptyState title="No parsed preview yet" description="Upload a resume to preview detected sections before analysis." /> : null}
            {upload.data?.parsedData ? (
              <div className="space-y-3">
                {upload.data.parsedData.redactedPreview ? (
                  <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    Anonymized preview generated. Redacted fields: {(upload.data.parsedData.redactedFields || []).join(", ") || "none"}.
                  </div>
                ) : null}
                <label className="space-y-1 text-sm font-medium">
                  Parsed summary
                  <textarea className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Parsed skills
                  <Input value={draftSkills} onChange={(event) => setDraftSkills(event.target.value)} placeholder="React, Node.js, MongoDB" />
                </label>
                <Button type="button" variant="outline" disabled={saveParsedData.isPending} onClick={() => saveParsedData.mutate()}><Save className="h-4 w-4" /> {saveParsedData.isPending ? "Saving..." : "Save parsed edits"}</Button>
                {saveParsedData.isSuccess ? <p className="text-sm text-emerald-600">Parsed resume edits saved.</p> : null}
                {saveParsedData.isError ? <ErrorState description={saveParsedData.error instanceof Error ? saveParsedData.error.message : "Could not save parsed edits."} /> : null}
                <pre aria-label="Parsed resume preview" className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(upload.data.parsedData.redactedPreview || upload.data.parsedData, null, 2)}</pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
