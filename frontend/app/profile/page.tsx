"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { splitList } from "@/lib/utils";

export default function ProfilePage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => api.get<any>("/profile") });
  const save = useMutation({
    mutationFn: (formData: FormData) => api.put("/profile", {
      headline: formData.get("headline"),
      currentRole: formData.get("currentRole"),
      targetRoles: splitList(String(formData.get("targetRoles") || "")),
      skills: splitList(String(formData.get("skills") || "")),
      preferredLocations: splitList(String(formData.get("preferredLocations") || "")),
      expectedSalary: Number(formData.get("expectedSalary") || 0),
      noticePeriod: formData.get("noticePeriod"),
      githubUrl: formData.get("githubUrl"),
      linkedinUrl: formData.get("linkedinUrl"),
      portfolioUrl: formData.get("portfolioUrl")
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] })
  });
  const p = profile.data || {};
  return (
    <AppShell>
      <PageHeading title="Career profile" description="Keep your target roles, skills, preferences, salary, links, and profile completeness current." />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate(new FormData(event.currentTarget));
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              {["headline", "currentRole", "targetRoles", "skills", "preferredLocations", "expectedSalary", "noticePeriod", "githubUrl", "linkedinUrl", "portfolioUrl"].map((field) => <Input key={field} name={field} placeholder={field} defaultValue={Array.isArray(p[field]) ? p[field].join(", ") : p[field] || ""} />)}
              <Button className="md:col-span-2" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save profile"}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Profile completeness</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">{p.profileCompletenessScore || 0}%</div>
            <Progress value={p.profileCompletenessScore || 0} />
            <p className="text-sm text-muted-foreground">Missing fields and AI suggestions appear here as your profile evolves.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
