import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { evaluateJobMatchWithAI } from "../services/ai.service.js";

const connection = new (IORedis as any)(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

connection.on("error", (err: any) => {
  if (process.env.NODE_ENV !== "test") {
    console.warn("BullMQ Redis connection warning:", err?.message || err);
  }
});

// Create Queue
export class JobMatchingQueue extends Queue {}
export const jobMatchingQueue = new JobMatchingQueue("job-matching-queue", { connection });

jobMatchingQueue.on("error", (err: any) => {
  if (process.env.NODE_ENV !== "test") {
    console.warn("BullMQ jobMatchingQueue warning:", err?.message || err);
  }
});

// Define Worker for Background Processing
export const worker = new Worker(
  "job-matching-queue",
  async (job) => {
    const { jobId, jobDescription, masterResume } = job.data;
    console.log(`Processing background AI match for job ID: ${jobId}`);

    // Run AI Evaluation
    const matchResult = await evaluateJobMatchWithAI(masterResume, jobDescription);

    // Save result to Database (pseudo-code integration)
    // await JobMatchModel.create({ jobId, ...matchResult });

    return { jobId, status: "completed", matchResult };
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job match worker completed successfully for id: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job match worker failed for id ${job?.id}:`, err);
});

worker.on("error", (err: any) => {
  if (process.env.NODE_ENV !== "test") {
    console.warn("Job match worker warning:", err?.message || err);
  }
});
