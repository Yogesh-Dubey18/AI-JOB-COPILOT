import { aiService } from "../ai/ai.service.js";

export async function generateFollowUpMessage(userId: string, payload: any) {
  return aiService.followUpMessage(userId, payload);
}
