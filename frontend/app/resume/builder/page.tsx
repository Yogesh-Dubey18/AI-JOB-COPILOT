"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Info,
  Link2,
  ListRestart,
  Plus,
  PlusCircle,
  Save,
  Sparkles,
  Trash2,
  User,
  Wrench
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  duration?: string;
  bullets: string[];
}

interface ProjectItem {
  name: string;
  technologies?: string;
  bullets: string[];
}

interface EducationItem {
  institution: string;
  degree?: string;
  field?: string;
  duration?: string;
}

interface ParsedData {
  name: string;
  email: string;
  phone: string;
  links: string[];
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications?: string[];
}

const defaultParsedData: ParsedData = {
  name: "",
  email: "",
  phone: "",
  links: [],
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: []
};

const categoryColors: Record<string, string> = {
  content: "bg-violet-500",
  format: "bg-blue-500",
  optimization: "bg-amber-500",
  bestPractices: "bg-emerald-500",
  applicationReadiness: "bg-rose-500"
};

const categoryProgressColors: Record<string, string> = {
  content: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  format: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  optimization: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  bestPractices: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  applicationReadiness: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
};

const categoryLabels: Record<string, string> = {
  content: "Content Quality",
  format: "ATS Format",
  optimization: "Role Keyword Match",
  bestPractices: "Best Practices",
  applicationReadiness: "Application Readiness"
};

export default function ResumeBuilderPage() {
  const [resumeId, setResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [jobDescription, setJobDescription] = useState("");
  const [parsedData, setParsedData] = useState<ParsedData>(defaultParsedData);
  const [activeTab, setActiveTab] = useState<"profile" | "skills" | "experience" | "projects" | "education">("profile");
  const [newSkill, setNewSkill] = useState("");
  const [newLink, setNewLink] = useState("");
  const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });

  const resumes = useQuery({
    queryKey: ["resumes"],
    queryFn: () => api.get<any[]>("/resumes"),
    retry: false
  });

  const selectedResume = resumes.data?.find((r) => r._id === resumeId);

  // Load selected resume into local state
  useEffect(() => {
    if (selectedResume?.parsedData) {
      const data = selectedResume.parsedData;
      setParsedData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        links: Array.isArray(data.links) ? data.links : [],
        summary: data.summary || "",
        skills: Array.isArray(data.skills) ? data.skills : [],
        experience: Array.isArray(data.experience) ? data.experience : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        education: Array.isArray(data.education) ? data.education : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : []
      });
      setSaveMessage({ text: "", type: "" });
    } else {
      setParsedData(defaultParsedData);
    }
  }, [selectedResume]);

  // Live scoring mutation (de-bouced)
  const scoreMutation = useMutation({
    mutationFn: (payload: { parsedData: ParsedData; targetRole: string; jobDescription: string }) =>
      api.post<any>("/resumes/score-draft", payload)
  });

  // Debounced live scoring call
  useEffect(() => {
    if (!resumeId) return;

    const timer = setTimeout(() => {
      scoreMutation.mutate({
        parsedData,
        targetRole,
        jobDescription
      });
    }, 850);

    return () => clearTimeout(timer);
  }, [parsedData, targetRole, jobDescription, resumeId]);

  // Save parsedData back to DB
  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch<any>("/resumes/" + resumeId + "/parsed-data", { parsedData }),
    onSuccess: (res) => {
      setSaveMessage({ text: "Resume saved successfully!", type: "success" });
      resumes.refetch();
    },
    onError: (err: any) => {
      setSaveMessage({ text: err?.message || "Failed to save resume", type: "error" });
    }
  });

  // Export PDF mutation
  const exportMutation = useMutation({
    mutationFn: () => api.post<any>("/resumes/" + resumeId + "/export-pdf", {}),
    onSuccess: (res) => {
      const url = res?.data?.fileUrl || res?.fileUrl;
      if (url) {
        window.open(url, "_blank");
      }
    }
  });

  // Handle skill operations
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !parsedData.skills.includes(trimmed)) {
      setParsedData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setParsedData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }));
  };

  const injectSkill = (skill: string) => {
    if (!parsedData.skills.includes(skill)) {
      setParsedData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  // Handle link operations
  const addLink = () => {
    const trimmed = newLink.trim();
    if (trimmed && !parsedData.links.includes(trimmed)) {
      setParsedData((prev) => ({
        ...prev,
        links: [...prev.links, trimmed]
      }));
      setNewLink("");
    }
  };

  const removeLink = (index: number) => {
    setParsedData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  // Experience handlers
  const addExperience = () => {
    const newItem: ExperienceItem = { company: "", role: "", location: "", duration: "", bullets: [""] };
    setParsedData((prev) => ({
      ...prev,
      experience: [...prev.experience, newItem]
    }));
  };

  const removeExperience = (index: number) => {
    setParsedData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: any) => {
    setParsedData((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const addExpBullet = (expIndex: number) => {
    setParsedData((prev) => {
      const expList = [...prev.experience];
      expList[expIndex] = {
        ...expList[expIndex],
        bullets: [...expList[expIndex].bullets, ""]
      };
      return { ...prev, experience: expList };
    });
  };

  const removeExpBullet = (expIndex: number, bulletIndex: number) => {
    setParsedData((prev) => {
      const expList = [...prev.experience];
      expList[expIndex] = {
        ...expList[expIndex],
        bullets: expList[expIndex].bullets.filter((_, i) => i !== bulletIndex)
      };
      return { ...prev, experience: expList };
    });
  };

  const updateExpBullet = (expIndex: number, bulletIndex: number, value: string) => {
    setParsedData((prev) => {
      const expList = [...prev.experience];
      const bulletList = [...expList[expIndex].bullets];
      bulletList[bulletIndex] = value;
      expList[expIndex] = { ...expList[expIndex], bullets: bulletList };
      return { ...prev, experience: expList };
    });
  };

  // Project handlers
  const addProject = () => {
    const newItem: ProjectItem = { name: "", technologies: "", bullets: [""] };
    setParsedData((prev) => ({
      ...prev,
      projects: [...prev.projects, newItem]
    }));
  };

  const removeProject = (index: number) => {
    setParsedData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const updateProject = (index: number, field: keyof ProjectItem, value: any) => {
    setParsedData((prev) => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
  };

  const addProjBullet = (projIndex: number) => {
    setParsedData((prev) => {
      const projList = [...prev.projects];
      projList[projIndex] = {
        ...projList[projIndex],
        bullets: [...projList[projIndex].bullets, ""]
      };
      return { ...prev, projects: projList };
    });
  };

  const removeProjBullet = (projIndex: number, bulletIndex: number) => {
    setParsedData((prev) => {
      const projList = [...prev.projects];
      projList[projIndex] = {
        ...projList[projIndex],
        bullets: projList[projIndex].bullets.filter((_, i) => i !== bulletIndex)
      };
      return { ...prev, projects: projList };
    });
  };

  const updateProjBullet = (projIndex: number, bulletIndex: number, value: string) => {
    setParsedData((prev) => {
      const projList = [...prev.projects];
      const bulletList = [...projList[projIndex].bullets];
      bulletList[bulletIndex] = value;
      projList[projIndex] = { ...projList[projIndex], bullets: bulletList };
      return { ...prev, projects: projList };
    });
  };

  // Education handlers
  const addEducation = () => {
    const newItem: EducationItem = { institution: "", degree: "", field: "", duration: "" };
    setParsedData((prev) => ({
      ...prev,
      education: [...prev.education, newItem]
    }));
  };

  const removeEducation = (index: number) => {
    setParsedData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: any) => {
    setParsedData((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  // Score outputs
  const liveResult = scoreMutation.data?.data;
  const liveScore = liveResult?.atsScore ?? selectedResume?.parsedData?.atsScore ?? 0;
  const liveBreakdown = liveResult?.categoryScores || {};
  const weaknesses = liveResult?.weaknesses || [];
  const missingKeywords = liveResult?.keywordCoverage?.missingKeywords || [];
  const jdMissingKeywords = liveResult?.jobDescriptionCoverage?.missingKeywords || [];

  return (
    <AppShell>
      <PageHeading
        title="Interactive Resume Builder"
        description="Edit your resume structure and watch your ATS score update in real-time. Direct injection for role/job keyword gaps."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* --- Editor Workspace --- */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle>1. Select resume & target context</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Base Resume</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                >
                  <option value="">Choose resume to build</option>
                  {(resumes.data || []).map((r) => (
                    <option key={r._id} value={r._id}>{r.fileName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Job Role</label>
                <Input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Target Role (e.g. React Developer)"
                  disabled={!resumeId}
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Action Toolbar</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={!resumeId || saveMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saveMutation.isPending ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportMutation.mutate()}
                    disabled={!resumeId || exportMutation.isPending}
                    title="Export to PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {saveMessage.text && (
            <div className={`p-3 rounded-md text-sm border flex items-center gap-2 ${
              saveMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{saveMessage.text}</span>
            </div>
          )}

          {resumeId ? (
            <div className="rounded-md border bg-card">
              {/* Tab headers */}
              <div className="flex flex-wrap border-b bg-muted/40 text-xs">
                {(["profile", "skills", "experience", "projects", "education"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-semibold border-r capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-background text-primary border-b-2 border-b-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name</label>
                        <Input
                          value={parsedData.name}
                          onChange={(e) => setParsedData((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Email</label>
                        <Input
                          value={parsedData.email}
                          onChange={(e) => setParsedData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone</label>
                        <Input
                          value={parsedData.phone}
                          onChange={(e) => setParsedData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 555-0199"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Professional Summary</label>
                      <Textarea
                        rows={4}
                        value={parsedData.summary}
                        onChange={(e) => setParsedData((prev) => ({ ...prev, summary: e.target.value }))}
                        placeholder="A short summary of your background, experience, and core goals..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Websites / Social Links</label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          placeholder="Add link (e.g. github.com/username)"
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                        />
                        <Button type="button" variant="outline" onClick={addLink}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {parsedData.links.map((link, idx) => (
                          <Badge key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary text-secondary-foreground border-transparent">
                            <Link2 className="h-3 w-3 text-muted-foreground" />
                            <span>{link}</span>
                            <button
                              type="button"
                              onClick={() => removeLink(idx)}
                              className="text-muted-foreground hover:text-destructive font-black ml-1 text-xs"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === "skills" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Add Skill Tags</label>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Type a skill and click add or press Enter..."
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                        />
                        <Button type="button" onClick={addSkill}>Add Skill</Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-2">Skills Inventory ({parsedData.skills.length})</label>
                      {parsedData.skills.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No skills listed yet. Add skills to increase ATS optimization.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {parsedData.skills.map((skill, idx) => (
                            <Badge key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="text-muted-foreground hover:text-destructive font-black ml-1 text-xs"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience Tab */}
                {activeTab === "experience" && (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Work History ({parsedData.experience.length})</label>
                      <Button type="button" variant="outline" onClick={addExperience}>
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Experience
                      </Button>
                    </div>

                    {parsedData.experience.length === 0 ? (
                      <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground text-sm">
                        No work experience logged. Click "Add Experience" to start.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {parsedData.experience.map((exp, idx) => (
                          <Card key={idx} className="border-muted bg-muted/20">
                            <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                              <span className="text-xs font-bold text-primary">Position #{idx + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive h-8 w-8 p-0"
                                onClick={() => removeExperience(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="p-3 pt-2 space-y-3">
                              <div className="grid gap-3 sm:grid-cols-4">
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] font-semibold text-muted-foreground">Company Name</label>
                                  <Input
                                    value={exp.company}
                                    onChange={(e) => updateExperience(idx, "company", e.target.value)}
                                    placeholder="Company"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground">Role / Title</label>
                                  <Input
                                    value={exp.role}
                                    onChange={(e) => updateExperience(idx, "role", e.target.value)}
                                    placeholder="Role Title"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground">Duration / Dates</label>
                                  <Input
                                    value={exp.duration || ""}
                                    onChange={(e) => updateExperience(idx, "duration", e.target.value)}
                                    placeholder="e.g. 2023 - Present"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[10px] font-semibold text-muted-foreground">Bullet Points (STAR metrics recommended)</label>
                                  <button
                                    type="button"
                                    onClick={() => addExpBullet(idx)}
                                    className="text-[10px] text-primary hover:underline"
                                  >
                                    + Add Bullet
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {exp.bullets.map((bullet, bIdx) => (
                                    <div key={bIdx} className="flex gap-2 items-center">
                                      <Input
                                        value={bullet}
                                        onChange={(e) => updateExpBullet(idx, bIdx, e.target.value)}
                                        placeholder="e.g. Developed REST APIs and integrated Stripe payments reducing checkout friction by 40%."
                                        className="text-xs"
                                      />
                                      <button
                                        type="button"
                                        disabled={exp.bullets.length <= 1}
                                        onClick={() => removeExpBullet(idx, bIdx)}
                                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Projects Tab */}
                {activeTab === "projects" && (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Listings ({parsedData.projects.length})</label>
                      <Button type="button" variant="outline" onClick={addProject}>
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Project
                      </Button>
                    </div>

                    {parsedData.projects.length === 0 ? (
                      <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground text-sm">
                        No projects listed yet. Click "Add Project" to begin.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {parsedData.projects.map((proj, idx) => (
                          <Card key={idx} className="border-muted bg-muted/20">
                            <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                              <span className="text-xs font-bold text-primary">Project #{idx + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive h-8 w-8 p-0"
                                onClick={() => removeProject(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="p-3 pt-2 space-y-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground">Project Name</label>
                                  <Input
                                    value={proj.name}
                                    onChange={(e) => updateProject(idx, "name", e.target.value)}
                                    placeholder="Project Name"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground">Technologies Used</label>
                                  <Input
                                    value={proj.technologies || ""}
                                    onChange={(e) => updateProject(idx, "technologies", e.target.value)}
                                    placeholder="e.g. React, Node.js, Tailwind"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[10px] font-semibold text-muted-foreground">Project Details / Highlights</label>
                                  <button
                                    type="button"
                                    onClick={() => addProjBullet(idx)}
                                    className="text-[10px] text-primary hover:underline"
                                  >
                                    + Add Bullet
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {proj.bullets.map((bullet, bIdx) => (
                                    <div key={bIdx} className="flex gap-2 items-center">
                                      <Input
                                        value={bullet}
                                        onChange={(e) => updateProjBullet(idx, bIdx, e.target.value)}
                                        placeholder="e.g. Architected a real-time multiplayer gaming platform handling 10k+ active sockets."
                                        className="text-xs"
                                      />
                                      <button
                                        type="button"
                                        disabled={proj.bullets.length <= 1}
                                        onClick={() => removeProjBullet(idx, bIdx)}
                                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Education Tab */}
                {activeTab === "education" && (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Education Details ({parsedData.education.length})</label>
                      <Button type="button" variant="outline" onClick={addEducation}>
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Education
                      </Button>
                    </div>

                    {parsedData.education.length === 0 ? (
                      <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground text-sm">
                        No education records entered. Click "Add Education" to start.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {parsedData.education.map((edu, idx) => (
                          <Card key={idx} className="border-muted bg-muted/20">
                            <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                              <span className="text-xs font-bold text-primary">Academic Record #{idx + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive h-8 w-8 p-0"
                                onClick={() => removeEducation(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                              <div className="grid gap-3 sm:grid-cols-4">
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] font-semibold text-muted-foreground">School / Institution</label>
                                  <Input
                                    value={edu.institution}
                                    onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                                    placeholder="Institution"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground">Degree (e.g. B.S.)</label>
                                  <Input
                                    value={edu.degree || ""}
                                    onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                    placeholder="Degree"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground">Field of Study</label>
                                  <Input
                                    value={edu.field || ""}
                                    onChange={(e) => updateEducation(idx, "field", e.target.value)}
                                    placeholder="Computer Science"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="text-center p-12 border-dashed">
              <CardContent className="space-y-3">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/60" />
                <h3 className="text-lg font-bold">No Resume Loaded</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Select an uploaded base resume from the dropdown above to load the editor and calculate live ATS scores.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Job Description Coverage Heuristic (Optional Context) */}
          {resumeId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Live Job Description Keyword Match (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste a target job description description to calculate job-specific keyword gap analysis."
                  rows={4}
                />
                {liveResult?.jobDescriptionCoverage && (
                  <div className="p-3 border rounded-md bg-muted/40 space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span>Job description fit:</span>
                      <span className="text-primary">{liveResult.jobDescriptionCoverage.coveragePercent}% match</span>
                    </div>
                    <Progress value={liveResult.jobDescriptionCoverage.coveragePercent} />

                    {jdMissingKeywords.length > 0 ? (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Gaps to close (Click + to inject):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {jdMissingKeywords.slice(0, 15).map((kw: string) => (
                            <Badge
                              key={kw}
                              onClick={() => injectSkill(kw)}
                              className="text-[10px] py-0.5 px-2 cursor-pointer hover:bg-primary hover:text-primary-foreground border-dashed bg-transparent border-muted-foreground/30 text-muted-foreground"
                            >
                              + {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Covered all keywords from the job description!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* --- Diagnostics Sidebar --- */}
        <div className="space-y-4">
          <Card className="sticky top-5">
            <CardHeader className="pb-3 border-b"><CardTitle>Live ATS Diagnostics</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Score Display */}
              <div className="text-center py-4 border-b">
                <span className={`text-6xl font-black tabular-nums ${
                  liveScore >= 80 ? "text-emerald-600" : liveScore >= 60 ? "text-amber-500" : "text-destructive"
                }`}>
                  {liveScore}
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Live ATS Score</p>
                {scoreMutation.isPending && (
                  <p className="text-[10px] text-muted-foreground animate-pulse mt-0.5">Recalculating score...</p>
                )}
              </div>

              {/* 5-Category Breakdown */}
              <div className="space-y-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scoring Categories</p>
                {Object.entries(categoryLabels).map(([key, label]) => {
                  const data = liveBreakdown[key] || { score: 0, max: 20 };
                  const percent = Math.round((data.score / data.max) * 100);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-muted-foreground">{label}</span>
                        <span className="font-semibold">{data.score} / {data.max} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${categoryColors[key] || "bg-primary"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Suggestions / Weaknesses */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Action Checklist</p>
                {weaknesses.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Looking solid! No immediate actions.</p>
                ) : (
                  <ul className="space-y-2">
                    {weaknesses.map((w: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Target Role Keywords matching */}
              {liveResult?.roleKeywordBank && (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{liveResult.roleKeywordBank.name.toUpperCase()} Keywords</p>
                    <span className="text-[10px] font-bold text-primary">{liveResult.keywordCoverage?.detectedKeywords?.length ?? 0}/{liveResult.roleKeywordBank.keywords?.length ?? 0}</span>
                  </div>
                  {missingKeywords.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">Click + to add missing skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {missingKeywords.map((kw: string) => (
                          <Badge
                            key={kw}
                            onClick={() => injectSkill(kw)}
                            className="text-[10px] py-0.5 px-2 cursor-pointer hover:bg-primary hover:text-primary-foreground bg-secondary text-secondary-foreground border-transparent"
                          >
                            + {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Matched all role keywords!</p>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 rounded bg-amber-50 text-[10px] text-amber-900 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300">
                <div className="flex gap-1.5 items-start">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <p>Heuristic scores are local estimates. Verify drafts yourself for factual correctness before downloading.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
