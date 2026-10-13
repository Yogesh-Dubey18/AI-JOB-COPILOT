import fs from "node:fs/promises";
import path from "node:path";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, deleteRecord, deleteRecords, findOneRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { anonymizeParsedResume, extractResumeTextDetailed, parseResumeText } from "./resume-parser.service.js";
import { validateResumeBuffer } from "./file-validation.service.js";
import { uploadFile, deleteFile, getProvider, getSignedUrl } from "./storage.service.js";

export async function resolveResumeUrl(resume: any) {
  if (!resume) return resume;
  const doc = resume.toObject ? resume.toObject() : resume;
  let key = doc.fileUrl;
  if (key.startsWith("/uploads/")) {
    key = key.replace("/uploads/", "");
  }
  doc.fileUrl = await getSignedUrl(key, String(doc.userId));
  return doc;
}

export async function resolveResumeVersionUrl(version: any) {
  if (!version) return version;
  const doc = version.toObject ? version.toObject() : version;
  if (doc.pdfUrl) {
    let key = doc.pdfUrl;
    if (key.startsWith("/uploads/")) {
      key = key.replace("/uploads/", "");
    }
    doc.pdfUrl = await getSignedUrl(key, String(doc.userId));
  }
  return doc;
}

export async function uploadResume(userId: string, file: Express.Multer.File, isBaseResume = true, options: { anonymizePreview?: boolean } = {}) {
  if (!file) throw new ApiError(400, "Resume file is required");

  try {
    const buffer = await fs.readFile(file.path);
    validateResumeBuffer(buffer, file.originalname, file.mimetype);

    const user = await findOneRecord("users", { _id: userId });
    const userFullName = user?.fullName;
    const userProfile = user ? { email: user.email, phone: user.phone } : undefined;

    const parsed = await extractResumeTextDetailed(file.path, file.mimetype);
    const parsedData = parseResumeText(parsed.text, userFullName, userProfile);
    const anonymizedPreview = options.anonymizePreview ? anonymizeParsedResume(parsedData, parsed.text) : null;

    const fileKey = `resumes/${userId}/${Date.now()}-${path.basename(file.path)}`;
    await uploadFile(fileKey, buffer, file.mimetype);

    let savedResume: any;
    try {
      savedResume = await createRecord("resumes", {
        userId,
        fileName: file.originalname,
        fileUrl: fileKey,
        fileType: file.mimetype,
        storageProvider: getProvider(),
        rawText: parsed.text,
        parsedData: {
          ...parsedData,
          parser: parsed.parser,
          parserQuality: parsed.quality,
          parserWarnings: parsed.warnings,
          parserWordCount: parsed.wordCount,
          redactedPreview: anonymizedPreview?.parsedData,
          redactedFields: anonymizedPreview?.redactedFields || []
        },
        isBaseResume
      });
      return await resolveResumeUrl(savedResume);
    } catch (error) {
      if (savedResume?._id) await deleteRecord("resumes", String(savedResume._id)).catch(() => {});
      await deleteFile(fileKey).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Resume upload could not be completed");
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
}

export async function listResumes(userId: string) {
  const list = await findRecords("resumes", { userId }, { sort: { createdAt: -1 } });
  return Promise.all(list.map((r) => resolveResumeUrl(r)));
}

export async function getResume(userId: string, id: string) {
  const resume = await findRecordById("resumes", id);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  return resolveResumeUrl(resume);
}

export async function updateResumeParsedData(userId: string, id: string, parsedData: any) {
  const resume = await getResume(userId, id);
  const nextParsedData = {
    ...resume.parsedData,
    ...parsedData,
    skills: Array.isArray(parsedData.skills) ? parsedData.skills : resume.parsedData?.skills || [],
    updatedByUser: true
  };
  const updated = await updateRecord("resumes", id, { parsedData: nextParsedData });
  if (!updated) throw new ApiError(404, "Resume not found");
  return resolveResumeUrl(updated);
}

export async function listResumeVersions(userId: string) {
  const list = await findRecords("resumeVersions", { userId }, { sort: { createdAt: -1 } });
  return Promise.all(list.map((v) => resolveResumeVersionUrl(v)));
}

export async function getResumeVersion(userId: string, id: string) {
  const version = await findRecordById("resumeVersions", id);
  if (!version || String(version.userId) !== userId) throw new ApiError(404, "Resume version not found");
  return resolveResumeVersionUrl(version);
}

export async function deleteResume(userId: string, id: string) {
  const resume = await findRecordById("resumes", id);
  if (!resume || String(resume.userId) !== String(userId)) {
    throw new ApiError(404, "Resume not found");
  }

  // 1. Storage file deletion via storage service (Cloudinary / S3 / Local disk)
  if (resume.fileUrl) {
    try {
      await deleteFile(resume.fileUrl);
    } catch {
      console.error("Resume object deletion failed; preserving the owning record for retry.");
      throw new ApiError(503, "Resume file could not be securely deleted. Please retry shortly.");
    }
  }

  // 2. Delete dependent records (ResumeVersions, TailoredResumes, ResumeAnalyses)
  await deleteRecords("resumeVersions", { userId, resumeId: id }).catch(() => {});
  await deleteRecords("tailoredResumes", { userId, resumeId: id }).catch(() => {});
  await deleteRecords("resumeAnalyses", { userId, resumeId: id }).catch(() => {});

  // 3. Delete base Resume document
  await deleteRecord("resumes", id);

  return { success: true, message: "Resume and associated versions deleted successfully" };
}
