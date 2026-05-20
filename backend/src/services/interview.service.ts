import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords } from "../utils/repository.js";

export async function createInterview(userId: string, input: any) {
  return createRecord("interviews", { userId, ...input });
}

export async function listInterviews(userId: string) {
  return findRecords("interviews", { userId }, { sort: { scheduledAt: 1 } });
}

export async function getInterview(userId: string, id: string) {
  const interview = await findRecordById("interviews", id);
  if (!interview || String(interview.userId) !== userId) throw new ApiError(404, "Interview not found");
  return interview;
}

export async function prepareForInterview(userId: string, interviewId: string) {
  const interview = await getInterview(userId, interviewId);
  return aiService.interviewPrep(userId, { interview });
}
