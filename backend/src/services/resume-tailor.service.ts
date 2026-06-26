import { aiService } from "../ai/ai.service.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { getJob } from "./job.service.js";
import { exportResumePdf } from "./pdf-export.service.js";

export async function tailorResumeForJob(userId: string, jobId: string, baseResumeId?: string, hostUrl?: string) {
  const job = await getJob(jobId);
  const resume = baseResumeId ? await findRecordById("resumes", baseResumeId) : (await findRecords("resumes", { userId }, { limit: 1, sort: { createdAt: -1 } }))[0];
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Base resume not found");
  const result = await aiService.tailorResume(userId, { job, resume, rules: ["Do not fake experience", "Do not add unknown skills", "Use job keywords naturally", "Keep ATS-friendly"] });
  
  const version = await createRecord("resumeVersions", {
    userId,
    baseResumeId: resume._id,
    title: job.title + " at " + job.company,
    targetRole: job.title,
    targetJobId: jobId,
    content: {
      summary: result.updatedSummary,
      skills: result.updatedSkills,
      projects: result.improvedProjects,
      education: resume.parsedData?.education || [],
      certifications: resume.parsedData?.certifications || []
    },
    atsScore: result.afterAtsScore,
    pdfUrl: ""
  });

  let realPdfUrl = "";
  try {
    const pdfExport = await exportResumePdf(userId, version._id);
    if (pdfExport && pdfExport.fileUrl) {
      let fileUrl = pdfExport.fileUrl;
      if (fileUrl.startsWith("/uploads")) {
        const baseUrl = hostUrl || process.env.BACKEND_URL || `http://localhost:${env.PORT || 5000}`;
        fileUrl = `${baseUrl}${fileUrl}`;
      }
      realPdfUrl = fileUrl;
      await updateRecord("resumeVersions", version._id, { pdfUrl: realPdfUrl });
    }
  } catch (err: any) {
    console.error("Failed to generate tailored resume PDF during tailoring flow:", err.message);
  }

  result.pdfUrl = realPdfUrl;

  return createRecord("tailoredResumes", { userId, jobId, baseResumeId: resume._id, resumeVersionId: version._id, ...result });
}
