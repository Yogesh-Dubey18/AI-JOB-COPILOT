import { aiService } from "../ai/ai.service.js";
import { createRecord, findOneRecord } from "../utils/repository.js";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "portfolio";
}

export async function generatePortfolio(userId: string, input: any) {
  const data = await aiService.portfolioGenerator(userId, input);
  const slug = slugify(input.slug || data.hero || "portfolio") + "-" + userId.slice(-5);
  return createRecord("portfolios", { userId, slug, isPublished: Boolean(input.isPublished), contactEmail: input.contactEmail, ...data });
}

export async function getPortfolioBySlug(slug: string) {
  return findOneRecord("portfolios", { slug });
}
