import { aiService } from "../ai/ai.service.js";
import { createRecord, findRecords } from "../utils/repository.js";

export async function generateSkillGap(userId: string, input: any) {
  const result = await aiService.skillGap(userId, input);
  return createRecord("learningPlans", { userId, ...result, progress: 0 });
}

export async function listLearningPlans(userId: string) {
  return findRecords("learningPlans", { userId }, { sort: { createdAt: -1 } });
}
