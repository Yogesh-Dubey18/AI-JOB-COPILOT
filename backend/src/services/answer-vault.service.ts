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

export async function listAnswerVault(userId: string) {
  return findRecords("answerVault", { userId }, { sort: { createdAt: -1 } });
}

export async function deleteAnswerVault(userId: string, id: string) {
  const existing = await findRecordById("answerVault", id);
  if (!existing || String(existing.userId) !== userId) {
    throw new ApiError(404, "Answer vault record not found");
  }
  return deleteRecord("answerVault", id);
}
