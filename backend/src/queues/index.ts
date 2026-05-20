import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis.js";

const connection = getRedisConnection();

function makeQueue(name: string) {
  if (!connection) {
    return {
      name,
      add: async (_jobName: string, data: any) => ({ id: "mock-" + Date.now(), data, queueName: name }),
      isFallback: true
    };
  }
  return new Queue(name, { connection });
}

export const resumeAnalysisQueue = makeQueue("resume-analysis");
export const jobImportQueue = makeQueue("job-import");
export const jobMatchingQueue = makeQueue("job-matching");
export const dailyDigestQueue = makeQueue("daily-digest");
export const emailReminderQueue = makeQueue("email-reminder");
export const interviewReminderQueue = makeQueue("interview-reminder");

export const queues = {
  resumeAnalysisQueue,
  jobImportQueue,
  jobMatchingQueue,
  dailyDigestQueue,
  emailReminderQueue,
  interviewReminderQueue
};
