"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type PrivacyPreferences = {
  allowAiTraining: boolean;
  shareProductAnalytics: boolean;
  emailDataExportUpdates: boolean;
  personalizationEnabled: boolean;
};

const preferenceLabels: Array<[keyof PrivacyPreferences, string, string]> = [
  ["allowAiTraining", "Allow AI training use", "Default is off. The current app does not train models on your data."],
  ["shareProductAnalytics", "Share product analytics", "Default is off. Keep this off for the most private local/demo usage."],
  ["emailDataExportUpdates", "Email export updates", "Receive account data export and deletion workflow notices when email is configured."],
  ["personalizationEnabled", "Personalized copilot suggestions", "Use your profile, resume, jobs, and applications to improve recommendations."]
];

export default function PrivacySettingsPage() {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState("");
  const preferences = useQuery({ queryKey: ["privacy-preferences"], queryFn: () => api.get<PrivacyPreferences>("/privacy/preferences"), retry: false });
  const updatePreferences = useMutation({
    mutationFn: (patch: Partial<PrivacyPreferences>) => api.patch<PrivacyPreferences>("/privacy/preferences", patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["privacy-preferences"] })
  });
  const exportData = useMutation({ mutationFn: () => api.get<any>("/privacy/export") });
  const deleteAccount = useMutation({ mutationFn: () => api.delete<any>("/privacy/account", { confirmation }) });
  const current = preferences.data || {
    allowAiTraining: false,
    shareProductAnalytics: false,
    emailDataExportUpdates: true,
    personalizationEnabled: true
  };

  return (
    <AppShell>
      <PageHeading title="Privacy and data" description="Export your data, manage privacy preferences, and use a guarded account deletion workflow." />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />Privacy preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preferenceLabels.map(([key, title, description]) => (
              <label key={key} className="flex gap-3 rounded-md border p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={Boolean(current[key])}
                  onChange={() => updatePreferences.mutate({ [key]: !current[key] })}
                />
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-muted-foreground">{description}</span>
                </span>
              </label>
            ))}
            {preferences.isError ? <p className="text-sm text-danger">Sign in to manage privacy preferences.</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Download className="h-4 w-4" />Data export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Download a JSON export of account, profile, resume, job-search, application, interview, notification, AI usage, billing, and feedback records.</p>
              <Button onClick={() => exportData.mutate()} disabled={exportData.isPending}>Generate export</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Trash2 className="h-4 w-4" />Delete account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">This removes user-owned records from the configured database or local mock store. Deployment backups and external providers still need manual runbook handling.</p>
              <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Type DELETE MY ACCOUNT" />
              <Button variant="danger" disabled={confirmation !== "DELETE MY ACCOUNT" || deleteAccount.isPending} onClick={() => deleteAccount.mutate()}>Delete my account</Button>
              {deleteAccount.isError ? <p className="text-sm text-danger">Deletion failed. Check the confirmation phrase and try again.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {exportData.data ? <pre className="mt-5 max-h-[420px] overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(exportData.data, null, 2)}</pre> : null}
      {deleteAccount.data ? <pre className="mt-5 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(deleteAccount.data, null, 2)}</pre> : null}
    </AppShell>
  );
}
