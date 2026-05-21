import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "portfolio";
}

const defaultSections = {
  showEmail: false,
  showResume: false,
  showProjects: true,
  showSkills: true,
  showLinks: true
};

async function uniqueSlug(base: string, userId: string, currentProfileId?: string) {
  const cleanBase = slugify(base);
  let candidate = cleanBase;
  let counter = 2;
  while (true) {
    const existing = await findOneRecord("publicProfiles", { slug: candidate });
    if (!existing || String(existing._id) === String(currentProfileId)) return candidate;
    candidate = `${cleanBase}-${counter}`;
    counter += 1;
  }
}

function normalizeArray(value: any): any[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function publicProfilePayload(userId: string, portfolio: any, input: any = {}) {
  const sections = { ...defaultSections, ...(portfolio.sections || {}), ...(input.sections || {}) };
  return {
    userId,
    portfolioId: String(portfolio._id),
    slug: portfolio.slug,
    displayName: input.displayName || portfolio.displayName || input.name || portfolio.hero || "AI Job Copilot User",
    headline: input.headline || portfolio.headline || portfolio.hero || "Full-stack developer",
    hero: portfolio.hero || input.hero || "Full-stack developer",
    about: portfolio.about || input.about || "",
    bio: input.bio || portfolio.about || "",
    skills: normalizeArray(portfolio.skills || input.skills),
    projects: normalizeArray(portfolio.projects || input.projects),
    resumeUrl: sections.showResume ? (input.resumeUrl || portfolio.resumeUrl || "") : "",
    contactEmail: sections.showEmail ? (input.contactEmail || portfolio.contactEmail || "") : "",
    links: input.links || portfolio.links || {},
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
  const data = await aiService.portfolioGenerator(userId, input);
  const slug = await uniqueSlug(input.slug || data.hero || "portfolio", userId);
  const portfolio = await createRecord("portfolios", {
    userId,
    slug,
    isPublished: Boolean(input.isPublished),
    contactEmail: input.contactEmail,
    resumeUrl: input.resumeUrl,
    theme: input.theme || "classic",
    sections: { ...defaultSections, ...(input.sections || {}) },
    ...data
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
  const nextSlug = input.slug ? await uniqueSlug(input.slug, userId, existing.publicProfile?._id) : existing.slug;
  const updated = await updateRecord("portfolios", id, {
    ...input,
    slug: nextSlug,
    sections: { ...defaultSections, ...(existing.sections || {}), ...(input.sections || {}) }
  });
  const publicProfile = await syncPublicProfile(userId, updated, input);
  return { ...updated, publicProfile, publicUrl: `/u/${publicProfile.slug}` };
}

export async function publishPortfolio(userId: string, id: string, input: any = {}) {
  return updatePortfolio(userId, id, { ...input, isPublished: input.isPublished !== false });
}

export async function getPublicPortfolio(slug: string) {
  const publicProfile = await findOneRecord("publicProfiles", { slug, isPublished: true });
  if (!publicProfile) throw new ApiError(404, "Public portfolio not found");
  const sections = { ...defaultSections, ...(publicProfile.sections || {}) };
  return {
    slug: publicProfile.slug,
    displayName: publicProfile.displayName,
    headline: publicProfile.headline,
    hero: publicProfile.hero,
    about: publicProfile.about,
    bio: publicProfile.bio,
    theme: publicProfile.theme || "classic",
    skills: sections.showSkills ? publicProfile.skills || [] : [],
    projects: sections.showProjects ? publicProfile.projects || [] : [],
    resumeUrl: sections.showResume ? publicProfile.resumeUrl || "" : "",
    contactEmail: sections.showEmail ? publicProfile.contactEmail || "" : "",
    links: sections.showLinks ? publicProfile.links || {} : {},
    sections,
    updatedAt: publicProfile.updatedAt
  };
}
