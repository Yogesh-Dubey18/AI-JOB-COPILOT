import path from "node:path";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords } from "../utils/repository.js";
import { extractResumeTextDetailed, parseResumeText } from "./resume-parser.service.js";

export async function uploadResume(userId: string, file: Express.Multer.File, isBaseResume = true) {
  if (!file) throw new ApiError(400, "Resume file is required");
  const parsed = await extractResumeTextDetailed(file.path, file.mimetype);
  const parsedData = parseResumeText(parsed.text);
  return createRecord("resumes", {
    userId,
    fileName: file.originalname,
    fileUrl: "/uploads/" + path.basename(file.path),
    fileType: file.mimetype,
    rawText: parsed.text,
    parsedData: { ...parsedData, parser: parsed.parser, parserWarnings: parsed.warnings },
    isBaseResume
  });
}

export async function listResumes(userId: string) {
  return findRecords("resumes", { userId }, { sort: { createdAt: -1 } });
}

export async function getResume(userId: string, id: string) {
  const resume = await findRecordById("resumes", id);
  if (!resume || String(resume.userId) !== userId) throw new ApiError(404, "Resume not found");
  return resume;
}

export async function listResumeVersions(userId: string) {
  return findRecords("resumeVersions", { userId }, { sort: { createdAt: -1 } });
}

export async function getResumeVersion(userId: string, id: string) {
  const version = await findRecordById("resumeVersions", id);
  if (!version || String(version.userId) !== userId) throw new ApiError(404, "Resume version not found");
  return version;
}
