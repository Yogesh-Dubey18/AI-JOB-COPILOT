import { aiService } from "../ai/ai.service.js";
import { createRecord, findRecordById, updateRecord } from "../utils/repository.js";

export async function chatWithMentor(userId: string, input: any) {
  let session = input.sessionId ? await findRecordById("chatSessions", input.sessionId) : null;
  const userMessage = { role: "user", content: input.message, metadata: input.metadata || {}, createdAt: new Date() };
  const ai = await aiService.chat(userId, { message: input.message, metadata: input.metadata });
  const assistantContent = ai?.answer || ai?.message || ai?.response || (ai ? JSON.stringify(ai) : "") || "I'm here to help. Please try again.";
  const assistantMessage = { role: "assistant", content: assistantContent, metadata: { suggestedActions: ai?.suggestedActions }, createdAt: new Date() };
  if (!session) {
    session = await createRecord("chatSessions", { userId, title: input.message.slice(0, 60), messages: [userMessage, assistantMessage] });
  } else {
    session = await updateRecord("chatSessions", String(session._id), { messages: [...(session.messages || []), userMessage, assistantMessage] });
  }
  return session;
}
