import fs from "node:fs/promises";
import path from "node:path";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { anonymizeParsedResume, extractResumeTextDetailed, parseResumeText } from "./resume-parser.service.js";
import { validateResumeBuffer } from "./file-validation.service.js";
import { uploadFile, getSignedUrl } from "./storage.service.js";

export async function resolveResumeUrl(resume: any) {
  if (!resume) return resume;
  const doc = resume.toObject ? resume.toObject() : resume;
  let key = doc.fileUrl;
  if (key.startsWith("/uploads/")) {
    key = key.replace("/uploads/", "");
  }
  doc.fileUrl = await getSignedUrl(key);
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
    doc.pdfUrl = await getSignedUrl(key);
  }
  return doc;
}

export async function uploadResume(userId: string, file: Express.Multer.File, isBaseResume = true, options: { anonymizePreview?: boolean } = {}) {
  if (!file) throw new ApiError(400, "Resume file is required");

  // Read file buffer for validation
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(file.path);
  } catch (err) {
    throw new ApiError(500, "Failed to read uploaded file");
  }

  // Validate the file buffer (magic numbers, sizes, executables)
  try {
    validateResumeBuffer(buffer, file.originalname, file.mimetype);
  } catch (err) {
    // Delete file from disk if validation fails
    try {
      await fs.unlink(file.path);
    } catch (_) {}
    throw err;
  }

  const parsed = await extractResumeTextDetailed(file.path, file.mimetype);
  const parsedData = parseResumeText(parsed.text);
  const anonymizedPreview = options.anonymizePreview ? anonymizeParsedResume(parsedData, parsed.text) : null;

  // Generate unique user-specific key for S3/R2 storage partition
  const fileKey = `resumes/${userId}/${Date.now()}-${path.basename(file.path)}`;

  // Upload to configured storage
  await uploadFile(fileKey, buffer, file.mimetype);

  // Remove local temp multer upload
  await fs.unlink(file.path).catch(() => {});

  const resume = await createRecord("resumes", {
    userId,
    fileName: file.originalname,
    fileUrl: fileKey,
    fileType: file.mimetype,
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

  return resolveResumeUrl(resume);
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
