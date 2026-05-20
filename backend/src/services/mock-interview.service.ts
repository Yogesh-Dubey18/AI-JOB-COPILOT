import { aiService } from "../ai/ai.service.js";
import { createRecord, findRecordById, updateRecord } from "../utils/repository.js";
import { ApiError } from "../utils/ApiError.js";

export async function startMockInterview(userId: string, input: any) {
  const first = "Tell me about the most relevant project for " + (input.role || "this role") + ".";
  return createRecord("mockInterviews", {
    userId,
    role: input.role || "Full Stack Developer",
    jobId: input.jobId,
    applicationId: input.applicationId,
    currentQuestion: first,
    transcript: [{ role: "assistant", content: first, createdAt: new Date() }],
    status: "active"
  });
}

export async function answerMockInterview(userId: string, input: any) {
  const session = await findRecordById("mockInterviews", input.sessionId);
  if (!session || String(session.userId) !== userId) throw new ApiError(404, "Mock interview session not found");
  const result = await aiService.mockInterview(userId, { question: session.currentQuestion, answer: input.answer, role: session.role });
  const transcript = [...(session.transcript || []), { role: "user", content: input.answer, createdAt: new Date() }, { role: "assistant", content: result.feedback, createdAt: new Date() }];
  return updateRecord("mockInterviews", String(session._id), { transcript, currentQuestion: result.nextQuestion, score: result.score, feedback: result.feedback });
}
