import { createRecord } from "../utils/repository.js";

export async function saveBuiltResume(userId: string, payload: any) {
  return createRecord("resumeVersions", {
    userId,
    baseResumeId: payload.baseResumeId,
    title: payload.title || "AI generated resume",
    targetRole: payload.targetRole,
    content: payload.content || {},
    atsScore: payload.atsScore || 78,
    pdfUrl: payload.pdfUrl || ""
  });
}
