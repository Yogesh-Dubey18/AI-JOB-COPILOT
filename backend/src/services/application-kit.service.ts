import { aiService } from "../ai/ai.service.js";
import { createRecord } from "../utils/repository.js";
import { getJob } from "./job.service.js";

export async function generateApplicationKit(userId: string, payload: any) {
  const job = payload.jobId ? await getJob(payload.jobId) : payload.job;
  const kit = await aiService.generateApplicationKit(userId, { ...payload, job });
  return createRecord("applicationKits", {
    userId,
    jobId: payload.jobId || job?._id,
    resumeVersionId: payload.resumeVersionId,
    ...kit
  });
}
