import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { randomUUID } from "node:crypto";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "portfolio";
}

const defaultSections = {
  showEmail: false,
  showPhone: false,
  showResume: false,
  showProjects: true,
  showSkills: true,
  showLinks: true,
  showRoadmap: false,
  showCaseStudies: true,
  showProofMappings: false
};

const versionedFields = [
  "title",
  "displayName",
  "hero",
  "headline",
  "about",
  "skills",
  "projects",
  "projectCaseStudies",
  "proofMappings",
  "resumeUrl",
  "contactEmail",
  "contactPhone",
  "githubUrl",
  "linkedinUrl",
  "theme",
  "sections",
  "isPublished"
];

const reservedWords = new Set([
  "admin", "api", "dashboard", "settings", "profile", "resume", "resumes",
  "jobs", "applications", "interviews", "portfolio", "portfolios", "login",
  "register", "auth", "public", "u", "help", "about", "blog", "pricing",
  "contact", "features", "feedback"
]);

export function validateSlug(slug: string): string | null {
  if (!slug) return "Slug is required";
  if (slug.length < 3 || slug.length > 30) return "Slug must be between 3 and 30 characters";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return "Slug must only contain lowercase letters, numbers, and single hyphens, and cannot start or end with a hyphen";
  }
  if (reservedWords.has(slug)) {
    return "This slug is reserved. Please choose a more specific portfolio slug";
  }
  return null;
}

async function hasSlugConflict(slug: string, currentPortfolioId?: string, currentProfileId?: string) {
  const [profile, portfolio] = await Promise.all([
    findOneRecord("publicProfiles", { slug }),
    findOneRecord("portfolios", { slug })
  ]);
  const profileConflict = profile && String(profile._id) !== String(currentProfileId || "");
  const portfolioConflict = portfolio && String(portfolio._id) !== String(currentPortfolioId || "");
  return Boolean(profileConflict || portfolioConflict);
}

async function assertExplicitSlugAvailable(slug: string, currentPortfolioId?: string, currentProfileId?: string) {
  if (await hasSlugConflict(slug, currentPortfolioId, currentProfileId)) {
    throw new ApiError(409, "This public slug is already taken. Please choose another slug.");
  }
}

export async function checkSlugAvailability(slug: string, currentPortfolioId?: string) {
  const cleanSlug = String(slug || "").trim();
  const validationError = validateSlug(cleanSlug);
  if (validationError) {
    return { available: false, slug: cleanSlug, message: validationError };
  }
  const currentProfile = currentPortfolioId ? await findOneRecord("publicProfiles", { portfolioId: currentPortfolioId }) : null;
  const available = !(await hasSlugConflict(cleanSlug, currentPortfolioId, currentProfile?._id));
  return {
    available,
    slug: cleanSlug,
    message: available ? "Slug is available." : "This public slug is already taken. Please choose another slug."
  };
}

async function uniqueSlug(base: string) {
  let cleanBase = slugify(base);
  if (reservedWords.has(cleanBase)) {
    cleanBase = `${cleanBase}-portfolio`;
  }
  let candidate = cleanBase;
  let counter = 2;
  while (true) {
    if (!(await hasSlugConflict(candidate))) return candidate;
    candidate = `${cleanBase}-${counter}`;
    counter += 1;
  }
}

function normalizeArray(value: any): any[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeString(value: any): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(value: any): string[] {
  if (Array.isArray(value)) return value.map(normalizeString).filter(Boolean);
  if (typeof value === "string") {
    return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeProofStatus(value: any): "verified" | "self-reported" | "missing" {
  return value === "verified" || value === "missing" ? value : "self-reported";
}

function normalizeConfidence(value: any): "strong" | "medium" | "weak" {
  return value === "strong" || value === "weak" ? value : "medium";
}

function normalizeCaseStudy(raw: any) {
  if (typeof raw === "string") {
    return {
      id: randomUUID(),
      projectName: raw,
      proofStatus: "self-reported",
      isPublic: false,
      showPublicProofNotes: false
    };
  }

  const techStack = normalizeStringList(raw?.techStack || raw?.technologies);
  return {
    id: normalizeString(raw?.id) || randomUUID(),
    projectName: normalizeString(raw?.projectName || raw?.title || raw?.name),
    problemSolved: normalizeString(raw?.problemSolved || raw?.description),
    techStack,
    contribution: normalizeString(raw?.contribution || raw?.role || raw?.userRole),
    keyFeatures: normalizeStringList(raw?.keyFeatures || raw?.features),
    challenges: normalizeString(raw?.challenges || raw?.challengesFaced),
    solutionApproach: normalizeString(raw?.solutionApproach || raw?.solution),
    resultLearning: normalizeString(raw?.resultLearning || raw?.result || raw?.learning),
    githubUrl: normalizeString(raw?.githubUrl),
    liveDemoUrl: normalizeString(raw?.liveDemoUrl || raw?.demoUrl),
    screenshotsUrl: normalizeString(raw?.screenshotsUrl || raw?.screenshotUrl),
    proofStatus: normalizeProofStatus(raw?.proofStatus),
    isPublic: Boolean(raw?.isPublic),
    publicProofNote: normalizeString(raw?.publicProofNote),
    privateProofNotes: normalizeString(raw?.privateProofNotes || raw?.proofNotes),
    showPublicProofNotes: Boolean(raw?.showPublicProofNotes)
  };
}

function normalizeCaseStudies(value: any): any[] {
  return normalizeArray(value)
    .map(normalizeCaseStudy)
    .filter((project) => project.projectName);
}

function normalizeProofMapping(raw: any) {
  return {
    id: normalizeString(raw?.id) || randomUUID(),
    skillName: normalizeString(raw?.skillName || raw?.skill),
    projectName: normalizeString(raw?.projectName || raw?.project),
    resumeBullet: normalizeString(raw?.resumeBullet),
    githubUrl: normalizeString(raw?.githubUrl),
    liveDemoUrl: normalizeString(raw?.liveDemoUrl || raw?.demoUrl),
    confidence: normalizeConfidence(raw?.confidence),
    isPublic: Boolean(raw?.isPublic),
    publicNote: normalizeString(raw?.publicNote),
    privateNotes: normalizeString(raw?.privateNotes || raw?.notes),
    showPublicNotes: Boolean(raw?.showPublicNotes),
    showResumeBullet: raw?.showResumeBullet !== false
  };
}

function normalizeProofMappings(value: any): any[] {
  return normalizeArray(value)
    .map(normalizeProofMapping)
    .filter((mapping) => mapping.skillName);
}

function buildCaseStudiesFromProjects(projects: any[]): any[] {
  return normalizeArray(projects).map((project) => {
    const source = typeof project === "object" ? project : { title: String(project) };
    return normalizeCaseStudy({
      projectName: source.title || source.name,
      problemSolved: source.description || "",
      techStack: source.techStack || source.technologies || [],
      proofStatus: "self-reported",
      isPublic: false
    });
  }).filter((project) => project.projectName);
}

function buildProofMappings(skills: any[], caseStudies: any[], existingMappings: any[] = []): any[] {
  const normalizedExisting = normalizeProofMappings(existingMappings);
  if (normalizedExisting.length) return normalizedExisting;

  return normalizeStringList(skills).slice(0, 12).map((skill) => {
    const matchingProject = caseStudies.find((project) =>
      normalizeStringList(project.techStack).some((tech) => tech.toLowerCase() === skill.toLowerCase())
    );
    return normalizeProofMapping({
      skillName: skill,
      projectName: matchingProject?.projectName || "",
      githubUrl: matchingProject?.githubUrl || "",
      liveDemoUrl: matchingProject?.liveDemoUrl || "",
      confidence: matchingProject ? "medium" : "weak",
      isPublic: false,
      privateNotes: matchingProject ? "Self-reported from portfolio project details." : "Add a project, resume bullet, GitHub link, or live demo to strengthen this proof."
    });
  });
}

function sanitizePublicProject(project: any, sections: typeof defaultSections) {
  if (typeof project !== "object" || project == null) return project;
  const linksAllowed = Boolean(sections.showLinks);
  const { privateProofNotes, proofNotes, internalNotes, ...safeProject } = project;
  return {
    ...safeProject,
    githubUrl: linksAllowed ? normalizeString(project.githubUrl) : "",
    liveDemoUrl: linksAllowed ? normalizeString(project.liveDemoUrl || project.demoUrl) : "",
    screenshotsUrl: linksAllowed ? normalizeString(project.screenshotsUrl || project.screenshotUrl) : ""
  };
}

function publicCaseStudies(projectCaseStudies: any[], sections: typeof defaultSections) {
  if (!sections.showProjects || !sections.showCaseStudies) return [];
  return normalizeCaseStudies(projectCaseStudies)
    .filter((project) => project.isPublic)
    .map((project) => ({
      id: project.id,
      isPublic: true,
      projectName: project.projectName,
      problemSolved: project.problemSolved,
      techStack: project.techStack,
      contribution: project.contribution,
      keyFeatures: project.keyFeatures,
      challenges: project.challenges,
      solutionApproach: project.solutionApproach,
      resultLearning: project.resultLearning,
      proofStatus: project.proofStatus,
      publicProofNote: project.showPublicProofNotes ? project.publicProofNote : "",
      showPublicProofNotes: Boolean(project.showPublicProofNotes),
      githubUrl: sections.showLinks ? project.githubUrl : "",
      liveDemoUrl: sections.showLinks ? project.liveDemoUrl : "",
      screenshotsUrl: sections.showLinks ? project.screenshotsUrl : ""
    }));
}

function publicProofMappings(proofMappings: any[], sections: typeof defaultSections) {
  if (!sections.showProofMappings) return [];
  return normalizeProofMappings(proofMappings)
    .filter((mapping) => mapping.isPublic)
    .map((mapping) => ({
      id: mapping.id,
      isPublic: true,
      skillName: mapping.skillName,
      projectName: mapping.projectName,
      resumeBullet: mapping.showResumeBullet ? mapping.resumeBullet : "",
      confidence: mapping.confidence,
      publicNote: mapping.showPublicNotes ? mapping.publicNote : "",
      showPublicNotes: Boolean(mapping.showPublicNotes),
      showResumeBullet: mapping.showResumeBullet !== false,
      githubUrl: sections.showLinks ? mapping.githubUrl : "",
      liveDemoUrl: sections.showLinks ? mapping.liveDemoUrl : ""
    }));
}

function versionSnapshot(portfolio: any) {
  return Object.fromEntries(versionedFields.map((field) => [field, portfolio[field]]));
}

function publicVersion(version: any) {
  return {
    id: version.id,
    title: version.title,
    changeSummary: version.changeSummary,
    visibilityStatus: version.visibilityStatus,
    createdAt: version.createdAt
  };
}

function publicProfilePayload(userId: string, portfolio: any, input: any = {}) {
  const sections = { ...defaultSections, ...(portfolio.sections || {}), ...(input.sections || {}) };
  const caseStudies = normalizeCaseStudies(portfolio.projectCaseStudies || input.projectCaseStudies);
  const proofMappings = normalizeProofMappings(portfolio.proofMappings || input.proofMappings);
  return {
    userId,
    portfolioId: String(portfolio._id),
    slug: portfolio.slug,
    title: input.title || portfolio.title || portfolio.displayName || portfolio.hero || "Career Portfolio",
    displayName: input.displayName || portfolio.displayName || input.name || "Portfolio Owner",
    headline: input.headline || portfolio.headline || portfolio.hero || "Professional portfolio",
    hero: input.hero || portfolio.hero || input.headline || portfolio.headline || "Professional portfolio",
    about: input.about || portfolio.about || "",
    bio: input.bio || portfolio.about || "",
    skills: normalizeArray(portfolio.skills || input.skills),
    projects: sections.showProjects ? normalizeArray(portfolio.projects || input.projects).map((project) => sanitizePublicProject(project, sections)) : [],
    projectCaseStudies: publicCaseStudies(caseStudies, sections),
    proofMappings: publicProofMappings(proofMappings, sections),
    resumeUrl: sections.showResume ? (input.resumeUrl || portfolio.resumeUrl || "") : "",
    contactEmail: sections.showEmail ? (input.contactEmail || portfolio.contactEmail || "") : "",
    contactPhone: sections.showPhone ? (input.contactPhone || portfolio.contactPhone || "") : "",
    githubUrl: sections.showLinks ? (input.githubUrl || portfolio.githubUrl || "") : "",
    linkedinUrl: sections.showLinks ? (input.linkedinUrl || portfolio.linkedinUrl || "") : "",
    links: {
      githubUrl: sections.showLinks ? (input.githubUrl || portfolio.githubUrl || "") : "",
      linkedinUrl: sections.showLinks ? (input.linkedinUrl || portfolio.linkedinUrl || "") : ""
    },
    theme: input.theme || portfolio.theme || "classic",
    visibility: portfolio.isPublished ? "public" : "private",
    sections,
    isPublished: Boolean(portfolio.isPublished)
  };
}

async function syncPublicProfile(userId: string, portfolio: any, input: any = {}) {
  const existing = await findOneRecord("publicProfiles", { portfolioId: String(portfolio._id) });
  const payload = publicProfilePayload(userId, portfolio, input);
  if (existing) return updateRecord("publicProfiles", String(existing._id), payload);
  return createRecord("publicProfiles", payload);
}

export async function generatePortfolio(userId: string, input: any) {
  const requestedSlug = input.slug ? String(input.slug).trim() : "";
  if (input.slug) {
    const slugErr = validateSlug(requestedSlug);
    if (slugErr) throw new ApiError(400, slugErr);
    await assertExplicitSlugAvailable(requestedSlug);
  }
  const data = await aiService.portfolioGenerator(userId, input);
  const slug = requestedSlug || await uniqueSlug(input.title || input.displayName || data.hero || "portfolio");
  const normalizedSkills = normalizeArray(input.skills).length ? normalizeArray(input.skills) : normalizeArray(data.skills);
  const normalizedProjects = normalizeArray(input.projects).length ? normalizeArray(input.projects) : normalizeArray(data.projects);
  const normalizedCaseStudies = normalizeCaseStudies(input.projectCaseStudies).length
    ? normalizeCaseStudies(input.projectCaseStudies)
    : buildCaseStudiesFromProjects(normalizedProjects);
  const normalizedProofMappings = buildProofMappings(normalizedSkills, normalizedCaseStudies, input.proofMappings);
  const portfolio = await createRecord("portfolios", {
    userId,
    ...data,
    slug,
    title: input.title || data.title || input.displayName || "Career Portfolio",
    displayName: input.displayName || data.displayName || input.name || "",
    headline: input.headline || data.headline || "",
    isPublished: Boolean(input.isPublished),
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    githubUrl: input.githubUrl,
    linkedinUrl: input.linkedinUrl,
    resumeUrl: input.resumeUrl,
    theme: input.theme || "classic",
    sections: { ...defaultSections, ...(input.sections || {}) },
    skills: normalizedSkills,
    projects: normalizedProjects,
    projectCaseStudies: normalizedCaseStudies,
    proofMappings: normalizedProofMappings,
    versionHistory: [],
    about: input.about || data.about || input.portfolioContext || input.message || ""
  });
  const publicProfile = await syncPublicProfile(userId, portfolio, input);
  return { ...portfolio, publicProfile, publicUrl: `/u/${publicProfile.slug}` };
}

export async function getPortfolioBySlug(slug: string) {
  return findOneRecord("portfolios", { slug });
}

export async function listPortfolios(userId: string) {
  const [portfolios, publicProfiles] = await Promise.all([
    findRecords("portfolios", { userId }, { sort: { createdAt: -1 } }),
    findRecords("publicProfiles", { userId })
  ]);
  return portfolios.map((portfolio: any) => ({
    ...portfolio,
    publicProfile: publicProfiles.find((profile: any) => String(profile.portfolioId) === String(portfolio._id)) || null
  }));
}

export async function getPortfolio(userId: string, id: string) {
  const portfolio = await findRecordById("portfolios", id);
  if (!portfolio || String(portfolio.userId) !== String(userId)) throw new ApiError(404, "Portfolio not found");
  const publicProfile = await findOneRecord("publicProfiles", { portfolioId: id });
  return { ...portfolio, publicProfile };
}

export async function updatePortfolio(userId: string, id: string, input: any) {
  const existing = await getPortfolio(userId, id);
  const requestedSlug = input.slug ? String(input.slug).trim() : "";
  if (input.slug) {
    const slugErr = validateSlug(requestedSlug);
    if (slugErr) throw new ApiError(400, slugErr);
    await assertExplicitSlugAvailable(requestedSlug, id, existing.publicProfile?._id);
  }
  const nextSlug = requestedSlug || existing.slug;
  const updatePayload: any = { ...input };
  if ("skills" in input) updatePayload.skills = normalizeArray(input.skills);
  if ("projects" in input) updatePayload.projects = normalizeArray(input.projects);
  if ("projectCaseStudies" in input) {
    updatePayload.projectCaseStudies = normalizeCaseStudies(input.projectCaseStudies);
  }
  if ("proofMappings" in input) {
    updatePayload.proofMappings = normalizeProofMappings(input.proofMappings);
  }
  const updated = await updateRecord("portfolios", id, {
    ...updatePayload,
    slug: nextSlug,
    sections: { ...defaultSections, ...(existing.sections || {}), ...(input.sections || {}) }
  });
  const publicProfile = await syncPublicProfile(userId, updated, input);
  return { ...updated, publicProfile, publicUrl: `/u/${publicProfile.slug}` };
}

export async function publishPortfolio(userId: string, id: string, input: any = {}) {
  return updatePortfolio(userId, id, { ...input, isPublished: input.isPublished !== false });
}

export async function savePortfolioVersion(userId: string, id: string, input: any = {}) {
  const portfolio = await getPortfolio(userId, id);
  const version = {
    id: randomUUID(),
    title: normalizeString(input.versionTitle || input.title) || `${portfolio.title || portfolio.displayName || "Portfolio"} snapshot`,
    changeSummary: normalizeString(input.changeSummary) || "Manual saved portfolio snapshot.",
    visibilityStatus: portfolio.isPublished ? "public" : "private",
    createdAt: new Date().toISOString(),
    snapshot: versionSnapshot(portfolio)
  };
  const versionHistory = [version, ...normalizeArray(portfolio.versionHistory)].slice(0, 25);
  await updateRecord("portfolios", id, { versionHistory });
  return publicVersion(version);
}

export async function listPortfolioVersions(userId: string, id: string) {
  const portfolio = await getPortfolio(userId, id);
  return normalizeArray(portfolio.versionHistory).map(publicVersion);
}

function findPortfolioVersion(portfolio: any, versionId: string) {
  const version = normalizeArray(portfolio.versionHistory).find((item) => String(item.id) === String(versionId));
  if (!version) throw new ApiError(404, "Portfolio version not found");
  return version;
}

export async function comparePortfolioVersion(userId: string, id: string, versionId: string) {
  const portfolio = await getPortfolio(userId, id);
  const version = findPortfolioVersion(portfolio, versionId);
  const snapshot = version.snapshot || {};
  const changedFields = versionedFields
    .filter((field) => JSON.stringify(snapshot[field] ?? null) !== JSON.stringify(portfolio[field] ?? null))
    .map((field) => ({
      field,
      current: portfolio[field] ?? null,
      previous: snapshot[field] ?? null
    }));

  return {
    version: publicVersion(version),
    changedFields
  };
}

export async function restorePortfolioVersion(userId: string, id: string, versionId: string, input: any = {}) {
  const portfolio = await getPortfolio(userId, id);
  const version = findPortfolioVersion(portfolio, versionId);
  const snapshot = version.snapshot || {};
  const restorePayload = versionedFields.reduce((acc: Record<string, any>, field) => {
    if (field in snapshot) acc[field] = snapshot[field];
    return acc;
  }, {});

  restorePayload.slug = portfolio.slug;
  restorePayload.versionHistory = portfolio.versionHistory || [];
  restorePayload.sections = { ...defaultSections, ...(snapshot.sections || {}) };
  if (input.restoreVisibility !== true) {
    restorePayload.isPublished = Boolean(portfolio.isPublished);
  }

  const restored = await updateRecord("portfolios", id, restorePayload);
  if (!restored) throw new ApiError(404, "Portfolio not found");
  const publicProfile = await syncPublicProfile(userId, restored, restored);
  return {
    ...restored,
    restoredVersion: publicVersion(version),
    publicProfile,
    publicUrl: `/u/${publicProfile.slug}`
  };
}

export async function getPublicPortfolio(slug: string) {
  const publicProfile = await findOneRecord("publicProfiles", { slug, isPublished: true });
  if (!publicProfile) throw new ApiError(404, "Public portfolio not found");
  const sections = { ...defaultSections, ...(publicProfile.sections || {}) };

  let roadmap: any = null;
  if (sections.showRoadmap) {
    const plan = await findOneRecord("learningPlans", { userId: publicProfile.userId });
    if (plan) {
      roadmap = {
        targetRole: plan.targetRole,
        progress: plan.progress,
        prioritySkills: plan.prioritySkills
      };
    }
  }

  return {
    slug: publicProfile.slug,
    title: publicProfile.title,
    displayName: publicProfile.displayName,
    headline: publicProfile.headline,
    hero: publicProfile.hero,
    about: publicProfile.about,
    bio: publicProfile.bio,
    theme: publicProfile.theme || "classic",
    skills: sections.showSkills ? publicProfile.skills || [] : [],
    projects: sections.showProjects ? (publicProfile.projects || []).map((project: any) => sanitizePublicProject(project, sections)) : [],
    projectCaseStudies: publicCaseStudies(publicProfile.projectCaseStudies || [], sections),
    proofMappings: publicProofMappings(publicProfile.proofMappings || [], sections),
    resumeUrl: sections.showResume ? publicProfile.resumeUrl || "" : "",
    contactEmail: sections.showEmail ? publicProfile.contactEmail || "" : "",
    contactPhone: sections.showPhone ? publicProfile.contactPhone || "" : "",
    githubUrl: sections.showLinks ? publicProfile.githubUrl || "" : "",
    linkedinUrl: sections.showLinks ? publicProfile.linkedinUrl || "" : "",
    links: sections.showLinks ? publicProfile.links || {} : {},
    roadmap,
    sections,
    updatedAt: publicProfile.updatedAt
  };
}
