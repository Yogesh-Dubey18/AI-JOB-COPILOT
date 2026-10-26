import { createRecord } from "../utils/repository.js";

export async function saveBuiltResume(userId: string, payload: any) {
  return createRecord("resumeVersions", {
    userId,
    baseResumeId: payload.baseResumeId,
    title: payload.title || "AI generated resume",
    targetRole: payload.targetRole,
    content: payload.content || {},
    atsScore: typeof payload.atsScore === "number" ? payload.atsScore : 0,
    pdfUrl: payload.pdfUrl || ""
  });
}
