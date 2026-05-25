import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, deleteRecord } from "../utils/repository.js";

type CareerVaultInput = {
  type: "experience" | "achievement" | "education" | "project" | "certification" | "skill";
  title: string;
  organisation?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  impact?: string;
  skills?: string[];
};

export async function createCareerVault(userId: string, input: CareerVaultInput) {
  if (!input.type) {
    throw new ApiError(400, "Entry type is required");
  }
  if (!input.title) {
    throw new ApiError(400, "Title is required");
  }
  return createRecord("careerVault", {
    userId,
    type: input.type,
    title: input.title,
    organisation: input.organisation,
    startDate: input.startDate,
    endDate: input.endDate,
    description: input.description,
    impact: input.impact,
    skills: input.skills || []
  });
}

export async function listCareerVault(userId: string) {
  return findRecords("careerVault", { userId }, { sort: { createdAt: -1 } });
}

export async function deleteCareerVault(userId: string, id: string) {
  const existing = await findRecordById("careerVault", id);
  if (!existing || String(existing.userId) !== userId) {
    throw new ApiError(404, "Career vault record not found");
  }
  return deleteRecord("careerVault", id);
}
