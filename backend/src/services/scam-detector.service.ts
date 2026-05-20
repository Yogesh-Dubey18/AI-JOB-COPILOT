import { aiService } from "../ai/ai.service.js";
import { createRecord } from "../utils/repository.js";

export async function checkJobScam(userId: string, input: any) {
  const report = await aiService.scamCheck(userId, input);
  return createRecord("jobScamReports", { userId, jobId: input.jobId, ...report });
}
