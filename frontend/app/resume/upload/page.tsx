"use client";

import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const upload = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      if (file) data.append("resume", file);
      data.append("isBaseResume", "true");
      return api.post<any>("/resumes/upload", data);
    }
  });
  return (
    <AppShell>
      <PageHeading title="Resume upload" description="Upload PDF, DOCX, or TXT. The backend validates type and size, extracts text, parses key sections, and saves a base resume." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Upload base resume</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".pdf,.docx,.txt" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <Button disabled={!file || upload.isPending} onClick={() => upload.mutate()}><Upload className="h-4 w-4" /> {upload.isPending ? "Uploading..." : "Upload resume"}</Button>
            {file ? <p className="text-sm text-muted-foreground">{file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Parsed preview</CardTitle></CardHeader>
          <CardContent><pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(upload.data?.parsedData || { empty: "Upload a resume to preview parsed sections." }, null, 2)}</pre></CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
