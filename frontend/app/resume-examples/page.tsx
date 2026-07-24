"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getStoredAccessToken } from "@/lib/auth-session";

export default function ResumeExamplesPage() {
  const [downloadingRole, setDownloadingRole] = useState<string | null>(null);

  const examplesQuery = useQuery({
    queryKey: ["resumeExamples"],
    queryFn: () => api.get<any[]>("/resumes/examples"),
    retry: false
  });

  const examples = examplesQuery.data || [];

  const handleDownloadTemplate = async (templateData: any, roleName: string) => {
    setDownloadingRole(roleName);
    try {
      const token = getStoredAccessToken();
      const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
      const response = await fetch(`${backendOrigin}/api/pdf-export/generate-complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ resumeData: templateData })
      });
      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Resume_Template_${roleName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to download template PDF:", err);
    } finally {
      setDownloadingRole(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeading
          title="📝 Role-Based Resume Examples & Templates"
          description="Browse ATS-optimized resume templates and sample bullet points for top engineering and tech roles."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {examples.map((example: any) => (
            <Card key={example.slug} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    {example.role}
                  </CardTitle>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {example.category}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Key ATS Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {example.keywords?.map((kw: string) => (
                      <span key={kw} className="bg-muted px-2 py-0.5 text-xs rounded-md font-medium text-foreground">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Sample STAR Bullet Points</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                    {example.sampleBullets?.map((bullet: string, idx: number) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <div className="p-6 pt-0 border-t mt-4">
                <Button
                  onClick={() => handleDownloadTemplate(example.templateData, example.role)}
                  disabled={downloadingRole === example.role}
                  className="w-full gap-2 mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  <Download className="h-4 w-4" />
                  {downloadingRole === example.role ? "Generating PDF..." : `Download ${example.role} Template`}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
