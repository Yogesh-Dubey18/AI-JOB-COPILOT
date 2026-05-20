"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { splitList } from "@/lib/utils";

const steps = ["Basic details", "Education", "Career target", "Skills", "Links", "Resume upload"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<any>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  async function finish() {
    setLoading(true);
    await api.put("/profile", {
      headline: form.headline,
      currentRole: form.currentRole,
      education: [{ degree: form.degree, college: form.college, graduationYear: form.graduationYear }],
      targetRoles: splitList(form.targetRoles || ""),
      experienceLevel: form.experienceLevel || "fresher",
      preferredJobTypes: splitList(form.preferredJobTypes || ""),
      preferredLocations: splitList(form.preferredLocations || ""),
      skills: splitList(form.skills || ""),
      softSkills: splitList(form.softSkills || ""),
      githubUrl: form.githubUrl,
      linkedinUrl: form.linkedinUrl,
      portfolioUrl: form.portfolioUrl
    });
    if (file) {
      const data = new FormData();
      data.append("resume", file);
      await api.post("/resumes/upload", data);
    }
    router.push("/dashboard");
  }

  return (
    <AppShell>
      <div className="mb-6"><h1 className="text-2xl font-bold">Onboarding</h1><p className="text-muted-foreground">Step {step + 1} of {steps.length}: {steps[step]}</p></div>
      <Card className="max-w-3xl">
        <CardHeader><CardTitle>{steps[step]}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? <><Input placeholder="Full name" onChange={(e) => set("fullName", e.target.value)} /><Input placeholder="Phone" onChange={(e) => set("phone", e.target.value)} /><Input placeholder="Location" onChange={(e) => set("preferredLocations", e.target.value)} /></> : null}
          {step === 1 ? <><Input placeholder="Degree" onChange={(e) => set("degree", e.target.value)} /><Input placeholder="College" onChange={(e) => set("college", e.target.value)} /><Input placeholder="Graduation year" onChange={(e) => set("graduationYear", Number(e.target.value))} /></> : null}
          {step === 2 ? <><Input placeholder="Target roles, comma separated" onChange={(e) => set("targetRoles", e.target.value)} /><Input placeholder="Experience level: fresher, junior, mid, senior" onChange={(e) => set("experienceLevel", e.target.value)} /><Input placeholder="Preferred job type" onChange={(e) => set("preferredJobTypes", e.target.value)} /></> : null}
          {step === 3 ? <><Input placeholder="Technical skills, comma separated" onChange={(e) => set("skills", e.target.value)} /><Input placeholder="Soft skills, comma separated" onChange={(e) => set("softSkills", e.target.value)} /></> : null}
          {step === 4 ? <><Input placeholder="GitHub URL" onChange={(e) => set("githubUrl", e.target.value)} /><Input placeholder="LinkedIn URL" onChange={(e) => set("linkedinUrl", e.target.value)} /><Input placeholder="Portfolio URL" onChange={(e) => set("portfolioUrl", e.target.value)} /></> : null}
          {step === 5 ? <Input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} /> : null}
          <div className="flex gap-2">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</Button>
            {step < steps.length - 1 ? <Button onClick={() => setStep((value) => value + 1)}>Next</Button> : <Button disabled={loading} onClick={finish}>{loading ? "Saving..." : "Finish"}</Button>}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
