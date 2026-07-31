import { getEmbedding } from "../ai/aiClient.js";
import { findRecordById, updateRecord } from "../utils/repository.js";

/**
 * Computes the cosine similarity between two equal-length vectors,
 * returning a value between -1 and 1 (in practice, for text embeddings,
 * almost always between 0 and 1).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Builds a compact text representation of a job for embedding purposes -
 * title, key skills, and a trimmed description capture the semantic
 * meaning of the role without wasting embedding tokens on boilerplate.
 */
function buildJobEmbeddingText(job: any): string {
  const parts = [
    job.title,
    Array.isArray(job.skillsRequired) ? job.skillsRequired.join(", ") : "",
    job.experienceRequired,
    (job.description || "").slice(0, 1200)
  ].filter(Boolean);
  return parts.join(". ");
}

/**
 * Builds a compact text representation of a candidate's resume for
 * embedding purposes - target title, skills, and project/experience
 * summaries capture what the candidate can actually do.
 */
function buildResumeEmbeddingText(resume: any): string {
  const parsed = resume?.parsedData || resume?.content || resume || {};
  const skills = Array.isArray(parsed.skills)
    ? parsed.skills
    : (parsed.skills && typeof parsed.skills === "object" ? Object.values(parsed.skills).flat() : []);
  const projectBits = Array.isArray(parsed.projects)
    ? parsed.projects.map((p: any) => `${p.name || ""}: ${(p.bullets || []).slice(0, 2).join(" ")}`)
    : [];
  const parts = [
    parsed.title,
    parsed.summary,
    Array.isArray(skills) ? skills.join(", ") : "",
    projectBits.join(". ")
  ].filter(Boolean);
  return parts.join(". ").slice(0, 4000);
}

/**
 * Returns a job's semantic embedding, computing and caching it on the Job
 * document the first time it's needed (so repeated match requests against
 * the same job don't re-call the embeddings API every time).
 */
async function getOrComputeJobEmbedding(job: any): Promise<number[] | null> {
  if (Array.isArray(job.embedding) && job.embedding.length > 0) {
    return job.embedding;
  }
  const embedding = await getEmbedding(buildJobEmbeddingText(job));
  if (embedding && job._id) {
    // Fire-and-forget cache write; a failure here should never block matching.
    updateRecord("jobs", String(job._id), { embedding }).catch(() => {});
  }
  return embedding;
}

export type SemanticFitResult = {
  available: boolean;
  score: number;
  reason: string;
};

/**
 * Computes a semantic (meaning-based) fit score between a candidate's
 * resume and a job, using OpenAI embeddings + cosine similarity. This
 * catches conceptually related skills that plain keyword matching misses
 * (e.g. "financial modeling" resume experience matching a job that asks
 * for "financial analysis").
 *
 * Gracefully returns { available: false } if no embeddings provider is
 * configured or the embedding call fails - callers should fall back to
 * keyword-only matching in that case, never surface this as an error.
 */
export async function computeSemanticFit(resume: any, job: any): Promise<SemanticFitResult> {
  const jobEmbedding = await getOrComputeJobEmbedding(job);
  if (!jobEmbedding) {
    return { available: false, score: 0, reason: "Semantic matching unavailable (no embeddings provider configured)." };
  }

  const resumeEmbedding = await getEmbedding(buildResumeEmbeddingText(resume));
  if (!resumeEmbedding) {
    return { available: false, score: 0, reason: "Semantic matching unavailable for this resume." };
  }

  const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
  // Cosine similarity for real-world text embeddings on related-but-distinct
  // documents typically falls in the 0.15-0.55 range even for strong
  // matches, and 0.55+ for near-identical content. Rescale to a more
  // intuitive 0-100 "fit" score with this in mind.
  const score = Math.round(Math.min(100, Math.max(0, (similarity - 0.1) / 0.5 * 100)));

  let reason: string;
  if (score >= 75) reason = "Your resume's overall skills and experience are a strong conceptual match for this role.";
  else if (score >= 50) reason = "Your resume shows a reasonable conceptual overlap with what this role requires.";
  else if (score >= 25) reason = "Your resume has some conceptual overlap with this role, but the core focus differs.";
  else reason = "Your resume's overall focus appears quite different from what this role requires.";

  return { available: true, score, reason };
}
