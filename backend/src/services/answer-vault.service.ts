import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, deleteRecord } from "../utils/repository.js";

type AnswerVaultInput = {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
};

export async function createAnswerVault(userId: string, input: AnswerVaultInput) {
  if (!input.question) {
    throw new ApiError(400, "Question is required");
  }
  if (!input.answer) {
    throw new ApiError(400, "Answer is required");
  }
  return createRecord("answerVault", {
    userId,
    question: input.question,
    answer: input.answer,
    category: input.category,
    tags: input.tags || []
  });
}

/**
 * Lists a user's saved Answer Vault entries (STAR-format interview
 * answers), paginated. Backward compatible - listAnswerVault(userId)
 * with no options still returns the first page (default 100 entries).
 */
export async function listAnswerVault(userId: string, options: { page?: number; limit?: number } = {}) {
  const limit = Math.max(1, Math.min(options.limit || 100, 200));
  const page = Math.max(1, options.page || 1);
  return findRecords("answerVault", { userId }, { sort: { createdAt: -1 }, limit, skip: (page - 1) * limit });
}

export async function deleteAnswerVault(userId: string, id: string) {
  const existing = await findRecordById("answerVault", id);
  if (!existing || String(existing.userId) !== userId) {
    throw new ApiError(404, "Answer vault record not found");
  }
  return deleteRecord("answerVault", id);
}
