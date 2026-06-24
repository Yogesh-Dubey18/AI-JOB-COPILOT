import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords } from "../utils/repository.js";
import { createNotification } from "./notification.service.js";

export async function createInterview(userId: string, input: any) {
  const interview = await createRecord("interviews", { userId, ...input });
  try {
    await createNotification(userId, {
      type: "interview_scheduled",
      title: `Interview Scheduled: ${interview.company}`,
      message: `Your ${interview.roundType} interview for the ${interview.role || "Software Developer"} position at ${interview.company} is scheduled for ${interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : "TBD"}.`,
      actionUrl: "/interviews",
      dedupeKey: `interview-scheduled:${interview._id}`
    });
  } catch (error) {
    console.error("Failed to trigger interview notification:", error);
  }
  return interview;
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
