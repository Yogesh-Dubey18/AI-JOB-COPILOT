import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, deleteRecord } from "../utils/repository.js";

type CompanyResearchInput = {
  companyName: string;
  industry?: string;
  techStack?: string[];
  culture?: string;
  glassdoorRating?: number;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  careerPageUrl?: string;
  interviewProcess?: string;
  notes?: string;
};

export async function createCompanyResearch(userId: string, input: CompanyResearchInput) {
  if (!input.companyName) {
    throw new ApiError(400, "Company name is required");
  }
  return createRecord("companyResearch", {
    userId,
    companyName: input.companyName,
    industry: input.industry,
    techStack: input.techStack || [],
    culture: input.culture,
    glassdoorRating: input.glassdoorRating,
    salaryRangeMin: input.salaryRangeMin,
    salaryRangeMax: input.salaryRangeMax,
    careerPageUrl: input.careerPageUrl,
    interviewProcess: input.interviewProcess,
    notes: input.notes
  });
}

/**
 * Lists a user's saved company research notes, paginated. Backward
 * compatible - listCompanyResearch(userId) with no options still
 * returns the first page (default 100 entries).
 */
export async function listCompanyResearch(userId: string, options: { page?: number; limit?: number } = {}) {
  const limit = Math.max(1, Math.min(options.limit || 100, 200));
  const page = Math.max(1, options.page || 1);
  return findRecords("companyResearch", { userId }, { sort: { createdAt: -1 }, limit, skip: (page - 1) * limit });
}

export async function deleteCompanyResearch(userId: string, id: string) {
  const existing = await findRecordById("companyResearch", id);
  if (!existing || String(existing.userId) !== userId) {
    throw new ApiError(404, "Company research record not found");
  }
  return deleteRecord("companyResearch", id);
}
