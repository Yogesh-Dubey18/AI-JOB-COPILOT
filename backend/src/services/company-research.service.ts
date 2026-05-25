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

export async function listCompanyResearch(userId: string) {
  return findRecords("companyResearch", { userId }, { sort: { createdAt: -1 } });
}

export async function deleteCompanyResearch(userId: string, id: string) {
  const existing = await findRecordById("companyResearch", id);
  if (!existing || String(existing.userId) !== userId) {
    throw new ApiError(404, "Company research record not found");
  }
  return deleteRecord("companyResearch", id);
}
