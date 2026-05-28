"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Copy, Download, Eye, FileJson, GitCompare, Globe2, Palette, RotateCcw, ShieldCheck, Sparkles, Upload, Wrench } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function fileHref(fileUrl: string) {
  return fileUrl?.startsWith("http") ? fileUrl : `${backendOrigin}${fileUrl}`;
}

function localId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type PortfolioForm = {
  slug: string;
  title: string;
  displayName: string;
  headline: string;
  contactEmail: string;
  contactPhone: string;
  githubUrl: string;
  linkedinUrl: string;
  resumeUrl: string;
  skillsText: string;
  projectsText: string;
  projectCaseStudies: ProjectCaseStudyForm[];
  proofMappings: ProofMappingForm[];
  theme: "classic" | "compact" | "bold";
  isPublished: boolean;
  sections: {
    showEmail: boolean;
    showPhone: boolean;
    showResume: boolean;
    showProjects: boolean;
    showSkills: boolean;
    showLinks: boolean;
    showRoadmap: boolean;
    showCaseStudies: boolean;
    showProofMappings: boolean;
  };
};

type ProjectCaseStudyForm = {
  id: string;
  projectName: string;
  problemSolved: string;
  techStackText: string;
  contribution: string;
  keyFeaturesText: string;
  challenges: string;
  solutionApproach: string;
  resultLearning: string;
  githubUrl: string;
  liveDemoUrl: string;
  screenshotsUrl: string;
  proofStatus: "verified" | "self-reported" | "missing";
  isPublic: boolean;
  publicProofNote: string;
  privateProofNotes: string;
  showPublicProofNotes: boolean;
};

type ProofMappingForm = {
  id: string;
  skillName: string;
  projectName: string;
  resumeBullet: string;
  githubUrl: string;
  liveDemoUrl: string;
  confidence: "strong" | "medium" | "weak";
  isPublic: boolean;
  publicNote: string;
  privateNotes: string;
  showPublicNotes: boolean;
  showResumeBullet: boolean;
};

type PortfolioProofFile = {
  fileId: string;
  projectId?: string;
  proofMappingId?: string;
  fileType: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  visibility: "private" | "publicApproved";
  downloadUrl?: string;
  signedUrlExpiresInSeconds?: number;
  storageStatusLabel?: string;
};

const defaultForm: PortfolioForm = {
  slug: "portfolio-slug",
  title: "",
  displayName: "",
  headline: "",
  contactEmail: "",
  contactPhone: "",
  githubUrl: "",
  linkedinUrl: "",
  resumeUrl: "",
  skillsText: "",
  projectsText: "",
  projectCaseStudies: [],
  proofMappings: [],
  theme: "classic",
  isPublished: false,
  sections: {
    showEmail: false,
    showPhone: false,
    showResume: false,
    showProjects: true,
    showSkills: true,
    showLinks: true,
    showRoadmap: false,
    showCaseStudies: true,
    showProofMappings: false
  }
};

const reservedSlugs = new Set([
  "admin", "api", "dashboard", "settings", "profile", "resume", "resumes",
  "jobs", "applications", "interviews", "portfolio", "portfolios", "login",
  "register", "auth", "public", "u", "help", "about", "blog", "pricing",
  "contact", "features", "feedback"
]);

function validateSlugInput(slug: string) {
  if (slug.length < 3 || slug.length > 30) return "Slug must be between 3 and 30 characters.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Slug can only contain lowercase letters, numbers, and single hyphens (no spaces, underscores, or special characters).";
  if (reservedSlugs.has(slug)) return "This slug is reserved. Please choose a more specific portfolio slug.";
  return null;
}

function parseSkills(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseProjects(value: string) {
  return value.split("\n").map((line) => {
    const [title, description = "", techStack = ""] = line.split("|").map((part) => part.trim());
    return title ? { title, description, techStack } : null;
  }).filter(Boolean);
}

function parseList(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function projectsToText(projects: any[] = []) {
  return projects.map((project) => {
    if (typeof project === "string") return project;
    return [project.title || project.name, project.description, project.techStack || project.technologies].filter(Boolean).join(" | ");
  }).filter(Boolean).join("\n");
}

function toCaseStudyForm(project?: any): ProjectCaseStudyForm {
  return {
    id: project?.id || localId(),
    projectName: project?.projectName || project?.title || project?.name || "",
    problemSolved: project?.problemSolved || project?.description || "",
    techStackText: Array.isArray(project?.techStack) ? project.techStack.join(", ") : project?.techStack || project?.technologies || "",
    contribution: project?.contribution || project?.role || project?.userRole || "",
    keyFeaturesText: Array.isArray(project?.keyFeatures) ? project.keyFeatures.join("\n") : project?.keyFeatures || project?.features || "",
    challenges: project?.challenges || project?.challengesFaced || "",
    solutionApproach: project?.solutionApproach || project?.solution || "",
    resultLearning: project?.resultLearning || project?.result || project?.learning || "",
    githubUrl: project?.githubUrl || "",
    liveDemoUrl: project?.liveDemoUrl || project?.demoUrl || "",
    screenshotsUrl: project?.screenshotsUrl || project?.screenshotUrl || "",
    proofStatus: project?.proofStatus === "verified" || project?.proofStatus === "missing" ? project.proofStatus : "self-reported",
    isPublic: Boolean(project?.isPublic),
    publicProofNote: project?.publicProofNote || "",
    privateProofNotes: project?.privateProofNotes || project?.proofNotes || "",
    showPublicProofNotes: Boolean(project?.showPublicProofNotes)
  };
}

function toProofMappingForm(mapping?: any): ProofMappingForm {
  return {
    id: mapping?.id || localId(),
    skillName: mapping?.skillName || mapping?.skill || "",
    projectName: mapping?.projectName || mapping?.project || "",
    resumeBullet: mapping?.resumeBullet || "",
    githubUrl: mapping?.githubUrl || "",
    liveDemoUrl: mapping?.liveDemoUrl || mapping?.demoUrl || "",
    confidence: mapping?.confidence === "strong" || mapping?.confidence === "weak" ? mapping.confidence : "medium",
    isPublic: Boolean(mapping?.isPublic),
    publicNote: mapping?.publicNote || "",
    privateNotes: mapping?.privateNotes || mapping?.notes || "",
    showPublicNotes: Boolean(mapping?.showPublicNotes),
    showResumeBullet: mapping?.showResumeBullet !== false
  };
}

function caseStudiesToPayload(projects: ProjectCaseStudyForm[]) {
  return projects.filter((project) => project.projectName.trim()).map((project) => ({
    id: project.id,
    projectName: project.projectName.trim(),
    problemSolved: project.problemSolved.trim(),
    techStack: parseList(project.techStackText),
    contribution: project.contribution.trim(),
    keyFeatures: parseList(project.keyFeaturesText),
    challenges: project.challenges.trim(),
    solutionApproach: project.solutionApproach.trim(),
    resultLearning: project.resultLearning.trim(),
    githubUrl: project.githubUrl.trim(),
    liveDemoUrl: project.liveDemoUrl.trim(),
    screenshotsUrl: project.screenshotsUrl.trim(),
    proofStatus: project.proofStatus,
    isPublic: project.isPublic,
    publicProofNote: project.publicProofNote.trim(),
    privateProofNotes: project.privateProofNotes.trim(),
    showPublicProofNotes: project.showPublicProofNotes
  }));
}

function proofMappingsToPayload(mappings: ProofMappingForm[]) {
  return mappings.filter((mapping) => mapping.skillName.trim()).map((mapping) => ({
    id: mapping.id,
    skillName: mapping.skillName.trim(),
    projectName: mapping.projectName.trim(),
    resumeBullet: mapping.resumeBullet.trim(),
    githubUrl: mapping.githubUrl.trim(),
    liveDemoUrl: mapping.liveDemoUrl.trim(),
    confidence: mapping.confidence,
    isPublic: mapping.isPublic,
    publicNote: mapping.publicNote.trim(),
    privateNotes: mapping.privateNotes.trim(),
    showPublicNotes: mapping.showPublicNotes,
    showResumeBullet: mapping.showResumeBullet
  }));
}

function buildSuggestedProofMappings(skillsText: string, caseStudies: ProjectCaseStudyForm[]) {
  return parseSkills(skillsText).slice(0, 10).map((skill) => {
    const project = caseStudies.find((item) => parseList(item.techStackText).some((tech) => tech.toLowerCase() === skill.toLowerCase()));
    return toProofMappingForm({
      skillName: skill,
      projectName: project?.projectName || "",
      githubUrl: project?.githubUrl || "",
      liveDemoUrl: project?.liveDemoUrl || "",
      confidence: project ? "medium" : "weak",
      privateNotes: project ? "Suggested from project tech stack. Review before making public." : "Add a project, resume bullet, GitHub link, or live demo to strengthen this proof."
    });
  });
}

export default function PortfolioGeneratorPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PortfolioForm>(defaultForm);
  const [context, setContext] = useState("React, Node.js, Express, MongoDB developer working on web apps.");
  const [exportJson, setExportJson] = useState<any>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [versionTitle, setVersionTitle] = useState("Recruiter-ready draft");
  const [changeSummary, setChangeSummary] = useState("Captured current portfolio content before proof or visibility changes.");
  const [compareResult, setCompareResult] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofTarget, setProofTarget] = useState("");
  const [proofVisibility, setProofVisibility] = useState<"private" | "publicApproved">("private");
  const [proofUploadMessage, setProofUploadMessage] = useState("");

  const portfolios = useQuery({ queryKey: ["portfolios"], queryFn: () => api.get<any[]>("/portfolios"), retry: false });
  const resumesQuery = useQuery({ queryKey: ["resumes"], queryFn: () => api.get<any[]>("/resumes"), retry: false });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: () => api.get<any>("/profile"), retry: false });
  const careerVaultQuery = useQuery({ queryKey: ["career-vault"], queryFn: () => api.get<any[]>("/career-vault"), retry: false });
  const roadmapQuery = useQuery({ queryKey: ["learning-plans"], queryFn: () => api.get<any[]>("/ai/skill-gap/plans"), retry: false });
  const storageStatus = useQuery({ queryKey: ["portfolio-storage-status"], queryFn: () => api.get<any>("/portfolios/storage/status"), retry: false });

  const items = portfolios.data || [];
  const storageInfo = storageStatus.data || {};
  const storageBadgeText = storageInfo.status === "provider_ready" ? "Provider-ready signed URLs" : "Local fallback";
  const storageStatusLabel = typeof storageInfo.label === "string" ? storageInfo.label : "Local fallback storage (not production-durable)";
  const signedUrlText = `Signed URL/download readiness: ${storageInfo.signedUrlTtlSeconds || 900} second TTL when S3/R2 is configured; local fallback uses app-served /uploads links.`;
  const careerVaultEntries = useMemo(() => Array.isArray(careerVaultQuery.data) ? careerVaultQuery.data : [], [careerVaultQuery.data]);
  const roadmapPlans = useMemo(() => Array.isArray(roadmapQuery.data) ? roadmapQuery.data : [], [roadmapQuery.data]);
  const selectedPortfolio = items[0];
  const versions = useQuery({
    queryKey: ["portfolio-versions", selectedPortfolio?._id],
    queryFn: () => api.get<any[]>(`/portfolios/${selectedPortfolio._id}/versions`),
    enabled: Boolean(selectedPortfolio?._id),
    retry: false
  });
  const slugCheck = useQuery({
    queryKey: ["portfolio-slug", form.slug, selectedPortfolio?._id],
    queryFn: () => api.get<any>(`/portfolios/slug/${form.slug}${selectedPortfolio?._id ? `?portfolioId=${selectedPortfolio._id}` : ""}`),
    enabled: !slugError && form.slug.length >= 3,
    retry: false
  });
  const hasResume = (resumesQuery.data || []).length > 0;
  const hasProfile = Boolean(profileQuery.data && (profileQuery.data.skills?.length > 0 || profileQuery.data.currentRole || profileQuery.data.headline));
  const hasCareerVault = careerVaultEntries.length > 0;
  const hasRoadmap = roadmapPlans.length > 0;
  const hasData = hasResume || hasProfile || hasCareerVault || hasRoadmap;

  // Auto-seed initial form values if portfolio is empty
  useEffect(() => {
    if (items.length === 0 && (profileQuery.data || resumesQuery.data || careerVaultEntries.length || roadmapPlans.length)) {
      const p = profileQuery.data || {};
      const r = resumesQuery.data?.[0]?.parsedData || {};
      const sourceProjects = [
        ...(r.projects || []),
        ...(careerVaultEntries.filter((entry: any) => entry.type === "project").map((entry: any) => ({
          title: entry.title,
          description: entry.description || entry.impact,
          techStack: (entry.skills || []).join(", ")
        })))
      ];
      const seededCaseStudies = sourceProjects.length ? sourceProjects.map(toCaseStudyForm) : [];
      const seededSkills = [
        ...(r.skills || []),
        ...(p.skills || []),
        ...((roadmapPlans[0]?.prioritySkills || []) as string[])
      ].filter(Boolean).join(", ");
      setForm((prev) => ({
        ...prev,
        title: prev.title || `${r.name || p.fullName || "My"} Career Portfolio`,
        displayName: prev.displayName || r.name || p.fullName || "Portfolio Owner",
        headline: prev.headline || p.headline || p.currentRole || "Full-stack developer",
        contactEmail: prev.contactEmail || r.email || p.email || "",
        contactPhone: prev.contactPhone || r.phone || "",
        githubUrl: prev.githubUrl || p.githubUrl || "",
        linkedinUrl: prev.linkedinUrl || p.linkedinUrl || "",
        resumeUrl: prev.resumeUrl || resumesQuery.data?.[0]?.fileUrl || "",
        skillsText: prev.skillsText || seededSkills,
        projectsText: prev.projectsText || projectsToText(sourceProjects),
        projectCaseStudies: prev.projectCaseStudies.length ? prev.projectCaseStudies : seededCaseStudies,
        proofMappings: prev.proofMappings.length ? prev.proofMappings : buildSuggestedProofMappings(seededSkills, seededCaseStudies)
      }));
    }
  }, [profileQuery.data, resumesQuery.data, careerVaultEntries, roadmapPlans, items.length]);

  function portfolioPayload() {
    return {
      slug: form.slug,
      title: form.title,
      displayName: form.displayName,
      headline: form.headline,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      githubUrl: form.githubUrl,
      linkedinUrl: form.linkedinUrl,
      resumeUrl: form.resumeUrl,
      theme: form.theme,
      isPublished: form.isPublished,
      sections: form.sections,
      skills: parseSkills(form.skillsText),
      projects: parseProjects(form.projectsText),
      projectCaseStudies: caseStudiesToPayload(form.projectCaseStudies),
      proofMappings: proofMappingsToPayload(form.proofMappings),
      about: context,
      message: context,
      portfolioContext: context
    };
  }

  const generate = useMutation({
    mutationFn: () => api.post<any>("/portfolios/generate", portfolioPayload()),
    onSuccess: (data) => {
      setExportJson(data);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });

  const update = useMutation({
    mutationFn: (portfolioId: string) => api.patch<any>(`/portfolios/${portfolioId}`, portfolioPayload()),
    onSuccess: (data) => {
      setExportJson(data);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });

  const publish = useMutation({
    mutationFn: (portfolio: any) => api.post<any>(`/portfolios/${portfolio._id}/publish`, {
      isPublished: !portfolio.isPublished,
      sections: portfolio.sections,
      theme: portfolio.theme
    }),
    onSuccess: (data) => {
      setExportJson(data);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });

  const generatePdf = useMutation({
    mutationFn: (portfolioId: string) => api.post<any>(`/exports/portfolio/${portfolioId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-exports"] });
    }
  });

  const saveVersion = useMutation({
    mutationFn: (portfolioId: string) => api.post<any>(`/portfolios/${portfolioId}/versions`, { versionTitle, changeSummary }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-versions"] });
    }
  });

  const restoreVersion = useMutation({
    mutationFn: ({ portfolioId, versionId }: { portfolioId: string; versionId: string }) =>
      api.post<any>(`/portfolios/${portfolioId}/versions/${versionId}/restore`, {}),
    onSuccess: (data) => {
      setExportJson(data);
      setCompareResult(null);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-versions"] });
    }
  });

  const compareVersion = useMutation({
    mutationFn: ({ portfolioId, versionId }: { portfolioId: string; versionId: string }) =>
      api.get<any>(`/portfolios/${portfolioId}/versions/${versionId}/compare`),
    onSuccess: (data) => setCompareResult(data)
  });

  const latestPortfolio = generate.data || items[0];
  const portfolioFiles = useQuery({
    queryKey: ["portfolio-files", latestPortfolio?._id || latestPortfolio?.id],
    queryFn: () => api.get<PortfolioProofFile[]>(`/portfolios/${latestPortfolio._id || latestPortfolio.id}/files`),
    enabled: Boolean(latestPortfolio?._id || latestPortfolio?.id),
    retry: false
  });
  const proofTargetOptions = useMemo(() => {
    const caseStudies: ProjectCaseStudyForm[] = (latestPortfolio?.projectCaseStudies?.length ? latestPortfolio.projectCaseStudies : form.projectCaseStudies).map(toCaseStudyForm);
    const mappings: ProofMappingForm[] = (latestPortfolio?.proofMappings?.length ? latestPortfolio.proofMappings : form.proofMappings).map(toProofMappingForm);
    return [
      ...caseStudies.map((project) => ({ value: `project:${project.id}`, label: `Case study: ${project.projectName || "Untitled project"}` })),
      ...mappings.map((mapping) => ({ value: `mapping:${mapping.id}`, label: `Skill proof: ${mapping.skillName || "Untitled skill"}` }))
    ];
  }, [form.projectCaseStudies, form.proofMappings, latestPortfolio]);

  const uploadProofFile = useMutation({
    mutationFn: (portfolioId: string) => {
      if (!proofFile) throw new Error("Select a proof file before uploading.");
      const body = new FormData();
      body.append("proofFile", proofFile);
      body.append("visibility", proofVisibility);
      const [targetType, targetId] = proofTarget.split(":");
      if (targetType === "project" && targetId) body.append("projectId", targetId);
      if (targetType === "mapping" && targetId) body.append("proofMappingId", targetId);
      return api.post<PortfolioProofFile>(`/portfolios/${portfolioId}/files/upload`, body);
    },
    onSuccess: (data) => {
      setProofUploadMessage(`${data.originalFilename || "Proof file"} uploaded as ${data.visibility === "publicApproved" ? "public approved" : "private"}.`);
      setProofFile(null);
      queryClient.invalidateQueries({ queryKey: ["portfolio-files"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });

  const updateProofFileVisibility = useMutation({
    mutationFn: ({ portfolioId, fileId, visibility }: { portfolioId: string; fileId: string; visibility: "private" | "publicApproved" }) =>
      api.patch<PortfolioProofFile>(`/portfolios/${portfolioId}/files/${fileId}`, { visibility }),
    onSuccess: (data) => {
      setProofUploadMessage(`${data.originalFilename || "Proof file"} visibility updated to ${data.visibility === "publicApproved" ? "public approved" : "private"}.`);
      queryClient.invalidateQueries({ queryKey: ["portfolio-files"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });

  const refreshProofFileUrl = useMutation({
    mutationFn: ({ portfolioId, fileId }: { portfolioId: string; fileId: string }) =>
      api.get<PortfolioProofFile>(`/portfolios/${portfolioId}/files/${fileId}/signed-url`),
    onSuccess: (data) => {
      setProofUploadMessage(`Signed URL refreshed for ${data.originalFilename || "proof file"}; expires in ${data.signedUrlExpiresInSeconds || 900} seconds.`);
      queryClient.invalidateQueries({ queryKey: ["portfolio-files"] });
    }
  });

  const deleteProofFile = useMutation({
    mutationFn: ({ portfolioId, fileId }: { portfolioId: string; fileId: string }) =>
      api.delete<any>(`/portfolios/${portfolioId}/files/${fileId}`),
    onSuccess: () => {
      setProofUploadMessage("Proof file deleted and detached from portfolio proof cards.");
      queryClient.invalidateQueries({ queryKey: ["portfolio-files"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    }
  });
  const serverSlugError = slugCheck.data && typeof slugCheck.data.available === "boolean" && !slugCheck.data.available ? slugCheck.data.message || "This public slug is already taken." : null;
  const effectiveSlugError = slugError || serverSlugError;
  const saveError = generate.error || update.error || publish.error || saveVersion.error || restoreVersion.error || compareVersion.error || uploadProofFile.error || updateProofFileVisibility.error || deleteProofFile.error || refreshProofFileUrl.error;

  function publicUrl(slug: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/u/${slug}`;
  }

  function copyPublicUrl(slug: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(publicUrl(slug));
    }
  }

  const handleSlugChange = (val: string) => {
    const slugVal = val.toLowerCase().replace(/\s+/g, "-");
    setForm((prev) => ({ ...prev, slug: slugVal }));
    setSlugError(validateSlugInput(slugVal));
  };

  const loadPortfolioForEditing = (portfolio: any) => {
    const existingCaseStudies = (portfolio.projectCaseStudies?.length ? portfolio.projectCaseStudies : portfolio.projects || []).map(toCaseStudyForm);
    const existingProofMappings = (portfolio.proofMappings?.length ? portfolio.proofMappings : buildSuggestedProofMappings((portfolio.skills || []).join(", "), existingCaseStudies)).map(toProofMappingForm);
    setForm({
      slug: portfolio.slug || "",
      title: portfolio.title || `${portfolio.displayName || portfolio.hero || "My"} Career Portfolio`,
      displayName: portfolio.displayName || portfolio.hero || "",
      headline: portfolio.headline || portfolio.hero || "",
      contactEmail: portfolio.contactEmail || "",
      contactPhone: portfolio.contactPhone || "",
      githubUrl: portfolio.githubUrl || "",
      linkedinUrl: portfolio.linkedinUrl || "",
      resumeUrl: portfolio.resumeUrl || "",
      skillsText: (portfolio.skills || []).join(", "),
      projectsText: projectsToText(portfolio.projects || []),
      projectCaseStudies: existingCaseStudies,
      proofMappings: existingProofMappings,
      theme: portfolio.theme || "classic",
      isPublished: Boolean(portfolio.isPublished),
      sections: {
        showEmail: Boolean(portfolio.sections?.showEmail),
        showPhone: Boolean(portfolio.sections?.showPhone),
        showResume: Boolean(portfolio.sections?.showResume),
        showProjects: Boolean(portfolio.sections?.showProjects ?? true),
        showSkills: Boolean(portfolio.sections?.showSkills ?? true),
        showLinks: Boolean(portfolio.sections?.showLinks ?? true),
        showRoadmap: Boolean(portfolio.sections?.showRoadmap),
        showCaseStudies: Boolean(portfolio.sections?.showCaseStudies ?? true),
        showProofMappings: Boolean(portfolio.sections?.showProofMappings)
      }
    });
    setContext(portfolio.about || "");
    setSlugError(null);
  };

  const updateCaseStudy = (id: string, patch: Partial<ProjectCaseStudyForm>) => {
    setForm((prev) => ({
      ...prev,
      projectCaseStudies: prev.projectCaseStudies.map((project) => project.id === id ? { ...project, ...patch } : project)
    }));
  };

  const updateProofMapping = (id: string, patch: Partial<ProofMappingForm>) => {
    setForm((prev) => ({
      ...prev,
      proofMappings: prev.proofMappings.map((mapping) => mapping.id === id ? { ...mapping, ...patch } : mapping)
    }));
  };

  const addCaseStudy = () => {
    setForm((prev) => ({ ...prev, projectCaseStudies: [...prev.projectCaseStudies, toCaseStudyForm()] }));
  };

  const addProofMapping = () => {
    setForm((prev) => ({ ...prev, proofMappings: [...prev.proofMappings, toProofMappingForm()] }));
  };

  const removeCaseStudy = (id: string) => {
    setForm((prev) => ({ ...prev, projectCaseStudies: prev.projectCaseStudies.filter((project) => project.id !== id) }));
  };

  const removeProofMapping = (id: string) => {
    setForm((prev) => ({ ...prev, proofMappings: prev.proofMappings.filter((mapping) => mapping.id !== id) }));
  };

  // Safe Empty State Rendering
  if (!hasData && items.length === 0 && !portfolios.isLoading && !resumesQuery.isLoading && !profileQuery.isLoading && !careerVaultQuery.isLoading && !roadmapQuery.isLoading) {
    return (
      <AppShell>
        <PageHeading title="Portfolio generator" description="Create a recruiter-safe public profile with custom privacy controls." />
        <Card className="mx-auto max-w-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Globe2 className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">No profile or resume data found</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                We seed your portfolio with your parsed resume projects, verified skills, and roadmap achievements. Please upload a resume or complete your profile first.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full">
              <Link href="/resume/upload">
                <Button className="w-full sm:w-auto"><Upload className="mr-2 h-4 w-4" /> Upload resume</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full sm:w-auto"><Wrench className="mr-2 h-4 w-4" /> Add skills</Button>
              </Link>
              <Link href="/career-vault">
                <Button variant="outline" className="w-full sm:w-auto">Add projects</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full sm:w-auto">Generate portfolio later</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeading title="Portfolio generator" description="Create a recruiter-safe public profile with publish controls, themes, and exportable content." />

      <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" data-testid="storage-warning">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Storage & Access Notice</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge data-testid="storage-status-badge">{storageBadgeText}</Badge>
              <Badge>File privacy: private by default</Badge>
            </div>
            <p className="mt-1 text-xs">Currently running in local storage fallback unless S3/R2 is configured. Generated PDFs can be written to local uploads, which means direct file URLs may be publicly accessible. Durable private storage and signed downloads are provider-ready and require manual setup before production use.</p>
            <p className="mt-1 text-xs">{storageStatusLabel}</p>
            <p className="mt-1 text-xs">{signedUrlText}</p>
            <p className="mt-1 text-xs font-semibold">Private files are only shared when you approve them.</p>
            <p className="mt-1 text-xs">Custom domain portfolio hosting is provider-ready only. This builder creates an app slug at /u/[slug] and does not provision a hosted domain.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.99fr_1.01fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />Builder Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Portfolio Title</label>
                <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="My Full-Stack Developer Portfolio" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
                <Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Portfolio Slug</label>
                <Input value={form.slug} onChange={(event) => handleSlugChange(event.target.value)} placeholder="public-slug-name" />
                {effectiveSlugError ? (
                  <p className="text-xs text-danger" role="alert">{effectiveSlugError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{slugCheck.isFetching ? "Checking slug..." : `URL: /u/${form.slug}`}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Headline</label>
                <Input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} placeholder="e.g. React & Node Developer" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Contact Email</label>
                <Input value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Contact Phone</label>
                <Input value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} placeholder="+1-555-0000" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">GitHub Profile Link</label>
                <Input value={form.githubUrl} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} placeholder="https://github.com/username" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">LinkedIn Profile Link</label>
                <Input value={form.linkedinUrl} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} placeholder="https://linkedin.com/in/username" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Resume PDF URL</label>
                <Input value={form.resumeUrl} onChange={(event) => setForm({ ...form, resumeUrl: event.target.value })} placeholder="https://example.com/resume.pdf" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">About Summary</label>
              <Textarea rows={3} value={context} onChange={(event) => setContext(event.target.value)} placeholder="Explain your core projects, tech stack, and experience." />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Skills</label>
                <Textarea rows={4} value={form.skillsText} onChange={(event) => setForm({ ...form, skillsText: event.target.value })} placeholder="React, Node.js, MongoDB" />
                <p className="text-xs text-muted-foreground">Comma-separated. Seeded from resume/profile/roadmap when available.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Projects</label>
                <Textarea rows={4} value={form.projectsText} onChange={(event) => setForm({ ...form, projectsText: event.target.value })} placeholder={"AI Job Copilot | Full-stack job search system | React, Node.js\nPortfolio Site | Public profile builder | Next.js"} />
                <p className="text-xs text-muted-foreground">One project per line: title | description | tech stack.</p>
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">Proof honesty rule</p>
              <p>Do not claim skills, results, or metrics that you cannot explain or prove.</p>
            </div>

            <div className="rounded-md border bg-muted/20 p-3 text-sm" data-testid="proof-file-readiness">
              <div className="flex flex-wrap items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <p className="font-semibold">Proof File Storage Readiness</p>
                <Badge>{storageBadgeText}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Screenshots, proof PDFs, and generated portfolio assets can reference private file metadata. Upload wiring remains safe and manual until a user explicitly adds files through the app flow.</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge>Private until publicApproved</Badge>
                <Badge>Signed download links expire</Badge>
                <Badge>S3/R2 provider-ready only</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{signedUrlText}</p>
            </div>

            <div className="rounded-md border bg-card/50 p-4 text-sm space-y-4" data-testid="proof-file-upload-section">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Proof File Upload</p>
                  <h3 className="font-semibold">Attach screenshots or PDFs to project proof</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Allowed file types: PNG, JPG, WEBP, PDF. Max file size: 5MB per file.</p>
                  <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">Private proof files are only shared publicly when you approve them.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{storageBadgeText}</Badge>
                  <Badge>Private by default</Badge>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Select proof file</label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                    aria-label="Upload proof file"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Attach to project or proof mapping</label>
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={proofTarget} onChange={(event) => setProofTarget(event.target.value)} aria-label="Attach proof file target">
                    <option value="">Portfolio-level file only</option>
                    {proofTargetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Visibility</label>
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={proofVisibility} onChange={(event) => setProofVisibility(event.target.value as "private" | "publicApproved")} aria-label="Proof file visibility">
                    <option value="private">Private</option>
                    <option value="publicApproved">Public approved</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!latestPortfolio || !proofFile || uploadProofFile.isPending}
                    onClick={() => uploadProofFile.mutate(latestPortfolio._id || latestPortfolio.id)}
                  >
                    {uploadProofFile.isPending ? "Uploading proof file..." : "Upload proof file"}
                  </Button>
                </div>
              </div>

              {!latestPortfolio ? (
                <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">Generate or save a portfolio before uploading proof files.</p>
              ) : null}
              {proofUploadMessage ? (
                <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-primary">{proofUploadMessage}</p>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Current Proof Files</p>
                {portfolioFiles.data?.length ? portfolioFiles.data.map((file) => (
                  <div key={file.fileId} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{file.originalFilename || file.fileType}</p>
                        <p className="text-xs text-muted-foreground">{file.mimeType} - {Math.ceil((file.size || 0) / 1024)} KB - signed links expire in {file.signedUrlExpiresInSeconds || 900}s</p>
                        <p className="text-xs text-muted-foreground">Owner-maintained proof: {file.projectId || file.proofMappingId ? "file-backed attachment" : "portfolio-level file"}. Not third-party verified.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{file.visibility === "publicApproved" ? "Public approved" : "Private"}</Badge>
                        <Badge>{file.storageStatusLabel || storageStatusLabel}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        className="h-9 rounded-md border bg-background px-3 text-xs"
                        value={file.visibility}
                        onChange={(event) => updateProofFileVisibility.mutate({
                          portfolioId: latestPortfolio._id || latestPortfolio.id,
                          fileId: file.fileId,
                          visibility: event.target.value as "private" | "publicApproved"
                        })}
                        aria-label={`Visibility for ${file.originalFilename || file.fileId}`}
                      >
                        <option value="private">Private</option>
                        <option value="publicApproved">Public approved</option>
                      </select>
                      {file.downloadUrl ? (
                        <a href={fileHref(file.downloadUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-semibold hover:bg-muted">Download signed URL</a>
                      ) : null}
                      <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => refreshProofFileUrl.mutate({ portfolioId: latestPortfolio._id || latestPortfolio.id, fileId: file.fileId })}>Refresh signed URL</Button>
                      <Button type="button" variant="ghost" className="h-9 px-3 text-xs" onClick={() => deleteProofFile.mutate({ portfolioId: latestPortfolio._id || latestPortfolio.id, fileId: file.fileId })}>Delete/detach</Button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">No proof files uploaded yet. Uploads remain private until you explicitly choose Public approved.</div>
                )}
              </div>
            </div>

            <div className="space-y-3" data-testid="case-study-editor">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Project Case-Study Builder</p>
                  <p className="text-xs text-muted-foreground">Keep each project recruiter-ready and mark public only after review.</p>
                </div>
                <Button type="button" variant="outline" onClick={addCaseStudy}>Add case study</Button>
              </div>

              {form.projectCaseStudies.length ? form.projectCaseStudies.map((project, index) => (
                <div key={project.id} className="rounded-md border bg-card/50 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Project case study #{index + 1}</p>
                    <Button type="button" variant="ghost" onClick={() => removeCaseStudy(project.id)}>Remove</Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Project name</label>
                      <Input value={project.projectName} onChange={(event) => updateCaseStudy(project.id, { projectName: event.target.value })} placeholder="AI Job Copilot" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Tech stack</label>
                      <Input value={project.techStackText} onChange={(event) => updateCaseStudy(project.id, { techStackText: event.target.value })} placeholder="React, Node.js, MongoDB" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">Problem solved</label>
                      <Textarea rows={2} value={project.problemSolved} onChange={(event) => updateCaseStudy(project.id, { problemSolved: event.target.value })} placeholder="What user or business problem did this solve?" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Your role / contribution</label>
                      <Textarea rows={2} value={project.contribution} onChange={(event) => updateCaseStudy(project.id, { contribution: event.target.value })} placeholder="What did you personally build or improve?" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Key features</label>
                      <Textarea rows={2} value={project.keyFeaturesText} onChange={(event) => updateCaseStudy(project.id, { keyFeaturesText: event.target.value })} placeholder={"Public slugs\nPDF export\nPrivacy controls"} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Challenges faced</label>
                      <Textarea rows={2} value={project.challenges} onChange={(event) => updateCaseStudy(project.id, { challenges: event.target.value })} placeholder="Mention tradeoffs, bugs, or constraints you can discuss." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Solution approach</label>
                      <Textarea rows={2} value={project.solutionApproach} onChange={(event) => updateCaseStudy(project.id, { solutionApproach: event.target.value })} placeholder="How did you solve it?" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">Result / learning</label>
                      <Textarea rows={2} value={project.resultLearning} onChange={(event) => updateCaseStudy(project.id, { resultLearning: event.target.value })} placeholder="Use learnings unless you have real measurable results." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">GitHub link</label>
                      <Input value={project.githubUrl} onChange={(event) => updateCaseStudy(project.id, { githubUrl: event.target.value })} placeholder="https://github.com/user/repo" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Live demo link</label>
                      <Input value={project.liveDemoUrl} onChange={(event) => updateCaseStudy(project.id, { liveDemoUrl: event.target.value })} placeholder="https://demo.example.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Screenshots link</label>
                      <Input value={project.screenshotsUrl} onChange={(event) => updateCaseStudy(project.id, { screenshotsUrl: event.target.value })} placeholder="Existing safe screenshot URL" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Proof status</label>
                      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={project.proofStatus} onChange={(event) => updateCaseStudy(project.id, { proofStatus: event.target.value as ProjectCaseStudyForm["proofStatus"] })}>
                        <option value="self-reported">Self-reported</option>
                        <option value="verified">User-marked verified</option>
                        <option value="missing">Missing proof</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Private proof notes</label>
                      <Textarea rows={2} value={project.privateProofNotes} onChange={(event) => updateCaseStudy(project.id, { privateProofNotes: event.target.value })} placeholder="Private notes for interview prep. Never shown publicly." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Public proof note</label>
                      <Textarea rows={2} value={project.publicProofNote} onChange={(event) => updateCaseStudy(project.id, { publicProofNote: event.target.value })} placeholder="Optional note that is safe to show." />
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-md border p-2">
                      <input type="checkbox" checked={project.isPublic} onChange={() => updateCaseStudy(project.id, { isPublic: !project.isPublic })} />
                      <span>Approve this case study for public portfolio</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border p-2">
                      <input type="checkbox" checked={project.showPublicProofNotes} onChange={() => updateCaseStudy(project.id, { showPublicProofNotes: !project.showPublicProofNotes })} />
                      <span>Show public proof note</span>
                    </label>
                  </div>
                </div>
              )) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No case studies yet. Add a project case study or seed from resume/career vault data.</div>
              )}
            </div>

            <div className="space-y-3" data-testid="proof-mapping-cards">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Skill-to-Proof Mapping</p>
                  <p className="text-xs text-muted-foreground">Map skills to projects, resume bullets, and proof links without inventing outcomes.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setForm((prev) => ({ ...prev, proofMappings: buildSuggestedProofMappings(prev.skillsText, prev.projectCaseStudies) }))}>Suggest mappings</Button>
                  <Button type="button" variant="outline" onClick={addProofMapping}>Add proof mapping</Button>
                </div>
              </div>

              {form.proofMappings.length ? form.proofMappings.map((mapping, index) => (
                <div key={mapping.id} className="rounded-md border bg-card/50 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Proof mapping #{index + 1}</p>
                    <Button type="button" variant="ghost" onClick={() => removeProofMapping(mapping.id)}>Remove</Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Skill name</label>
                      <Input value={mapping.skillName} onChange={(event) => updateProofMapping(mapping.id, { skillName: event.target.value })} placeholder="React" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Project where used</label>
                      <Input value={mapping.projectName} onChange={(event) => updateProofMapping(mapping.id, { projectName: event.target.value })} placeholder="AI Job Copilot" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">Resume bullet where mentioned</label>
                      <Textarea rows={2} value={mapping.resumeBullet} onChange={(event) => updateProofMapping(mapping.id, { resumeBullet: event.target.value })} placeholder="Built privacy-safe portfolio builder with Next.js and Express." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">GitHub proof link</label>
                      <Input value={mapping.githubUrl} onChange={(event) => updateProofMapping(mapping.id, { githubUrl: event.target.value })} placeholder="https://github.com/user/repo" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Live proof link</label>
                      <Input value={mapping.liveDemoUrl} onChange={(event) => updateProofMapping(mapping.id, { liveDemoUrl: event.target.value })} placeholder="https://demo.example.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Confidence</label>
                      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={mapping.confidence} onChange={(event) => updateProofMapping(mapping.id, { confidence: event.target.value as ProofMappingForm["confidence"] })}>
                        <option value="strong">Strong</option>
                        <option value="medium">Medium</option>
                        <option value="weak">Weak</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Private proof notes</label>
                      <Textarea rows={2} value={mapping.privateNotes} onChange={(event) => updateProofMapping(mapping.id, { privateNotes: event.target.value })} placeholder="Private prep note. Never shown publicly." />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">Public proof note</label>
                      <Input value={mapping.publicNote} onChange={(event) => updateProofMapping(mapping.id, { publicNote: event.target.value })} placeholder="Optional safe note for recruiters." />
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-md border p-2">
                      <input type="checkbox" checked={mapping.isPublic} onChange={() => updateProofMapping(mapping.id, { isPublic: !mapping.isPublic })} />
                      <span>Show mapping publicly</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border p-2">
                      <input type="checkbox" checked={mapping.showPublicNotes} onChange={() => updateProofMapping(mapping.id, { showPublicNotes: !mapping.showPublicNotes })} />
                      <span>Show public note</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border p-2">
                      <input type="checkbox" checked={mapping.showResumeBullet} onChange={() => updateProofMapping(mapping.id, { showResumeBullet: !mapping.showResumeBullet })} />
                      <span>Show resume bullet</span>
                    </label>
                  </div>
                </div>
              )) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No proof mappings yet. Add one manually or generate suggestions from your skills and project tech stack.</div>
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase"><Palette className="h-4 w-4" />Theme Selection</p>
              <div className="flex flex-wrap gap-2">
                {(["classic", "compact", "bold"] as const).map((t) => (
                  <Button key={t} type="button" variant={form.theme === t ? "primary" : "outline"} onClick={() => setForm({ ...form, theme: t })}>{t}</Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Privacy & Visibility Controls</p>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showEmail}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showEmail: !form.sections.showEmail } })}
                  />
                  <span>Show contact email</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showPhone}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showPhone: !form.sections.showPhone } })}
                  />
                  <span>Show phone number</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showResume}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showResume: !form.sections.showResume } })}
                  />
                  <span>Show resume download</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showRoadmap}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showRoadmap: !form.sections.showRoadmap } })}
                  />
                  <span>Show learning achievements</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showLinks}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showLinks: !form.sections.showLinks } })}
                  />
                  <span>Show social links</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showCaseStudies}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showCaseStudies: !form.sections.showCaseStudies } })}
                  />
                  <span>Show public case studies</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50">
                  <input
                    type="checkbox"
                    checked={form.sections.showProofMappings}
                    onChange={() => setForm({ ...form, sections: { ...form.sections, showProofMappings: !form.sections.showProofMappings } })}
                  />
                  <span>Show public proof mapping</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 bg-card/50 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={() => setForm({ ...form, isPublished: !form.isPublished })}
                  />
                  <span className="font-semibold text-primary">Make portfolio publicly visible</span>
                </label>
              </div>
            </div>

            {saveError ? (
              <p className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger" role="alert">{(saveError as Error).message}</p>
            ) : null}

            <div className="flex gap-2">
              <Button disabled={generate.isPending || !!effectiveSlugError || slugCheck.isFetching} onClick={() => generate.mutate()}><Sparkles className="h-4 w-4" />{generate.isPending ? "Generating..." : "Generate portfolio"}</Button>
              {latestPortfolio && (
                <Button variant="outline" disabled={update.isPending || !!effectiveSlugError || slugCheck.isFetching} onClick={() => update.mutate(latestPortfolio._id || latestPortfolio.id)}>{update.isPending ? "Saving Edits..." : "Save Edits"}</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Globe2 className="h-4 w-4" />Portfolio Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {latestPortfolio ? (
              <>
                <div className="rounded-md border p-4 bg-muted/20 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{latestPortfolio.theme || "classic"}</Badge>
                    <Badge className={latestPortfolio.isPublished ? "bg-primary text-primary-foreground" : ""}>{latestPortfolio.isPublished ? "Published" : "Private/Hidden"}</Badge>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{latestPortfolio.title || "Career Portfolio"}</p>
                  <h2 className="text-xl font-bold">{latestPortfolio.displayName || latestPortfolio.hero || "Your Portfolio"}</h2>
                  <p className="text-sm font-semibold text-primary">{latestPortfolio.headline || "Full-stack developer"}</p>
                  <p className="text-sm text-muted-foreground">{latestPortfolio.about || "Portfolio summary details will appear here."}</p>
                  <p className="text-xs text-muted-foreground font-mono">{latestPortfolio.slug}</p>

                  {latestPortfolio.skills?.length ? (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {latestPortfolio.skills.map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => publish.mutate(latestPortfolio)}>{latestPortfolio.isPublished ? "Unpublish" : "Publish to Web"}</Button>
                  <Button variant="outline" onClick={() => copyPublicUrl(latestPortfolio.publicProfile?.slug || latestPortfolio.slug)}><Copy className="h-4 w-4" />Copy URL</Button>
                  <Link href={`/u/${latestPortfolio.publicProfile?.slug || latestPortfolio.slug}`} target="_blank" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"><Eye className="h-4 w-4" />Preview Public Portfolio</Link>
                  <Button variant="outline" onClick={() => setExportJson(latestPortfolio)}><FileJson className="h-4 w-4" />Export JSON</Button>
                  <Button
                    variant="outline"
                    disabled={generatePdf.isPending}
                    onClick={() => generatePdf.mutate(latestPortfolio._id || latestPortfolio.id)}
                    aria-label="Generate Portfolio PDF"
                  >
                    {generatePdf.isPending ? "Generating PDF..." : "Generate PDF"}
                  </Button>
                  {generatePdf.data?.fileUrl && (
                    <a
                      href={fileHref(generatePdf.data.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-emerald-50/50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                      aria-label="Download PDF"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                  )}
                </div>

                <div className="rounded-md border p-4 space-y-3" data-testid="version-history">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-1 h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Portfolio Version History</p>
                      <p className="text-xs text-muted-foreground">Saved versions keep a private snapshot. Restore keeps the current slug and does not force public visibility changes.</p>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={versionTitle} onChange={(event) => setVersionTitle(event.target.value)} placeholder="Version title" aria-label="Version title" />
                    <Input value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} placeholder="Change summary" aria-label="Change summary" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saveVersion.isPending}
                    onClick={() => saveVersion.mutate(latestPortfolio._id || latestPortfolio.id)}
                  >
                    <ShieldCheck className="h-4 w-4" /> {saveVersion.isPending ? "Saving Version..." : "Save current version"}
                  </Button>

                  {versions.data?.length ? (
                    <div className="space-y-2">
                      {versions.data.map((version: any) => (
                        <div key={version.id} className="rounded-md border bg-muted/20 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{version.title}</p>
                              <p className="text-xs text-muted-foreground">{version.changeSummary || "No change summary provided."}</p>
                              <p className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()} · {version.visibilityStatus}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={compareVersion.isPending}
                                onClick={() => compareVersion.mutate({ portfolioId: latestPortfolio._id || latestPortfolio.id, versionId: version.id })}
                              >
                                <GitCompare className="h-4 w-4" /> Compare
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={restoreVersion.isPending}
                                onClick={() => restoreVersion.mutate({ portfolioId: latestPortfolio._id || latestPortfolio.id, versionId: version.id })}
                              >
                                <RotateCcw className="h-4 w-4" /> Restore
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No saved portfolio versions yet.</p>
                  )}

                  {compareResult?.changedFields?.length ? (
                    <div className="rounded-md bg-muted p-3 text-xs">
                      <p className="mb-1 font-semibold">Changed fields compared with current portfolio:</p>
                      <p>{compareResult.changedFields.map((field: any) => field.field).join(", ")}</p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-md border p-5 text-sm text-muted-foreground text-center">No portfolio generated yet. Complete the builder form and click Generate portfolio.</div>
            )}
            {exportJson ? <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(exportJson, null, 2)}</pre> : null}
          </CardContent>
        </Card>
      </div>

      {items.length > 1 && (
        <div className="mt-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Saved Portfolios</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((portfolio: any) => (
              <Card key={portfolio._id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => loadPortfolioForEditing(portfolio)}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold truncate">{portfolio.displayName || portfolio.hero || portfolio.slug}</h3>
                    <Badge className={portfolio.isPublished ? "bg-primary text-primary-foreground" : ""}>{portfolio.isPublished ? "Published" : "Private"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">/u/{portfolio.slug}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-8 px-3 text-xs" onClick={(e) => { e.stopPropagation(); publish.mutate(portfolio); }}>{portfolio.isPublished ? "Unpublish" : "Publish"}</Button>
                    <Button variant="ghost" className="h-8 px-3 text-xs" onClick={(e) => { e.stopPropagation(); setExportJson(portfolio); }}>JSON</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
