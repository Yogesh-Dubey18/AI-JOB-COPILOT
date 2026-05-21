"use client";

import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const RESUME_TYPES = [".pdf", ".docx", ".txt"];

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const upload = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      if (file) data.append("resume", file);
      data.append("isBaseResume", "true");
      return api.post<any>("/resumes/upload", data);
    }
  });
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
            {fileError ? <p role="alert" className="text-sm text-danger">{fileError}</p> : null}
            <Button type="button" disabled={!file || upload.isPending} onClick={() => upload.mutate()} aria-busy={upload.isPending}><Upload className="h-4 w-4" /> {upload.isPending ? "Uploading..." : "Upload resume"}</Button>
            {file ? <p className="text-sm text-muted-foreground">{file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB</p> : null}
            {upload.isError ? <ErrorState description={upload.error instanceof Error ? upload.error.message : "Could not upload resume."} /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Parsed preview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upload.isPending ? <LoadingState title="Parsing resume" description="Extracting text and identifying skills, links, education, and projects." /> : null}
            {!upload.isPending && !upload.data?.parsedData ? <EmptyState title="No parsed preview yet" description="Upload a resume to preview detected sections before analysis." /> : null}
            {upload.data?.parsedData ? <pre aria-label="Parsed resume preview" className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(upload.data.parsedData, null, 2)}</pre> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
