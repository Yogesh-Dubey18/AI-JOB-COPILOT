import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, deleteRecord, findOneRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import {
  deleteFile,
  getProvider,
  getSignedUrl,
  getSignedUrlTtlSeconds,
  getStorageStatus,
  normalizeStorageKey,
  uploadFile
} from "./storage.service.js";
import { validatePortfolioProofFileBuffer } from "./file-validation.service.js";

const fileTypes = new Set(["resumePdf", "portfolioPdf", "screenshot", "proofFile", "other"]);
const storageProviders = new Set(["local", "s3", "r2"]);

function normalizeFileType(value: any) {
  return fileTypes.has(value) ? value : "other";
}

function normalizeVisibility(value: any): "private" | "publicApproved" {
  return value === "publicApproved" ? "publicApproved" : "private";
}

function normalizeProvider(value: any): "local" | "s3" | "r2" {
  const provider = storageProviders.has(value) ? value : getProvider();
  return provider === "s3" || provider === "r2" ? provider : "local";
}

function normalizeSize(value: any) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? size : 0;
}

function sanitizeFilename(filename: string) {
  const safe = String(filename || "proof-file").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return safe.slice(0, 120) || "proof-file";
}

function inferProofFileType(input: any, mimeType: string) {
  if (input?.fileType === "screenshot") return "screenshot";
  if (input?.fileType === "proofFile") return "proofFile";
  return mimeType.startsWith("image/") ? "screenshot" : "proofFile";
}

export function sanitizePortfolioFileReference(raw: any) {
  if (!raw || typeof raw !== "object") return null;
  const storageKey = raw.storageKey || raw.fileKey;
  if (!storageKey) return null;

  let safeStorageKey = "";
  try {
    safeStorageKey = normalizeStorageKey(storageKey);
  } catch {
    return null;
  }

  return {
    fileId: String(raw.fileId || raw.id || randomUUID()),
    portfolioId: raw.portfolioId ? String(raw.portfolioId) : "",
    projectId: raw.projectId ? String(raw.projectId) : "",
    proofMappingId: raw.proofMappingId ? String(raw.proofMappingId) : "",
    fileType: normalizeFileType(raw.fileType),
    storageProvider: normalizeProvider(raw.storageProvider),
    storageKey: safeStorageKey,
    originalFilename: typeof raw.originalFilename === "string" ? raw.originalFilename.trim() : "",
    mimeType: typeof raw.mimeType === "string" && raw.mimeType.trim() ? raw.mimeType.trim() : "application/octet-stream",
    size: normalizeSize(raw.size),
    visibility: normalizeVisibility(raw.visibility),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString()
  };
}

export async function presentPortfolioFile(file: any, options: { includeSignedUrl?: boolean; allowPrivate?: boolean } = {}) {
  const safeFile = sanitizePortfolioFileReference(file);
  if (!safeFile) return null;
  const status = getStorageStatus();
  const result: any = {
    fileId: safeFile.fileId,
    portfolioId: safeFile.portfolioId,
    projectId: safeFile.projectId,
    proofMappingId: safeFile.proofMappingId,
    fileType: safeFile.fileType,
    storageProvider: safeFile.storageProvider,
    storageKey: safeFile.storageKey,
    originalFilename: safeFile.originalFilename,
    mimeType: safeFile.mimeType,
    size: safeFile.size,
    visibility: safeFile.visibility,
    createdAt: safeFile.createdAt,
    updatedAt: safeFile.updatedAt,
    isLocalFallback: status.localFallback,
    storageStatus: status.status,
    storageStatusLabel: status.label,
    signedUrlExpiresInSeconds: getSignedUrlTtlSeconds()
  };

  const canIssueUrl = options.includeSignedUrl && (options.allowPrivate || safeFile.visibility === "publicApproved");
  if (canIssueUrl) {
    result.downloadUrl = await getSignedUrl(safeFile.storageKey);
  }

  return result;
}

export async function resolvePublicPortfolioFiles(files: any[] = []) {
  const publicFiles = files
    .map(sanitizePortfolioFileReference)
    .filter((file): file is NonNullable<ReturnType<typeof sanitizePortfolioFileReference>> => Boolean(file && file.visibility === "publicApproved"));

  const resolved = await Promise.all(publicFiles.map((file) => presentPortfolioFile(file, { includeSignedUrl: true })));
  return resolved.filter(Boolean).map((file: any) => {
    const { storageKey, ...publicFile } = file;
    return publicFile;
  });
}

export function sanitizePortfolioFileReferences(files: any[] = []) {
  return files.map(sanitizePortfolioFileReference).filter(Boolean);
}

async function assertPortfolioOwner(userId: string, portfolioId: string) {
  const portfolio = await findRecordById("portfolios", portfolioId);
  if (!portfolio || String(portfolio.userId) !== String(userId)) {
    throw new ApiError(404, "Portfolio not found");
  }
  return portfolio;
}

async function findOwnedPortfolioFile(userId: string, portfolioId: string, fileId: string) {
  const file = await findOneRecord("portfolioFiles", { ownerId: userId, portfolioId, fileId });
  if (!file) throw new ApiError(404, "Portfolio proof file not found");
  return file;
}

export async function createPortfolioFileMetadata(userId: string, portfolioId: string, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  const safeInput = sanitizePortfolioFileReference({
    ...input,
    portfolioId,
    storageProvider: input.storageProvider || getProvider(),
    visibility: input.visibility || "private"
  });

  if (!safeInput) {
    throw new ApiError(400, "A valid private storage key is required for portfolio file metadata.");
  }

  const created = await createRecord("portfolioFiles", {
    ...safeInput,
    ownerId: userId,
    portfolioId,
    fileId: safeInput.fileId || randomUUID()
  });

  return presentPortfolioFile(created, { includeSignedUrl: true, allowPrivate: true });
}

export async function uploadPortfolioProofFile(userId: string, portfolioId: string, file: Express.Multer.File | undefined, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  if (!file?.buffer) {
    throw new ApiError(400, "Proof file is required");
  }

  validatePortfolioProofFileBuffer(file.buffer, file.originalname, file.mimetype);

  const fileId = randomUUID();
  const safeName = sanitizeFilename(file.originalname);
  const storageKey = await uploadFile(`portfolio-proof/${userId}/${portfolioId}/${fileId}-${safeName}`, file.buffer, file.mimetype);
  const created = await createRecord("portfolioFiles", {
    fileId,
    ownerId: userId,
    portfolioId,
    projectId: input.projectId ? String(input.projectId) : "",
    proofMappingId: input.proofMappingId ? String(input.proofMappingId) : "",
    fileType: inferProofFileType(input, file.mimetype),
    storageProvider: getProvider(),
    storageKey,
    originalFilename: safeName,
    mimeType: file.mimetype,
    size: file.size || file.buffer.length,
    visibility: normalizeVisibility(input.visibility)
  });

  return presentPortfolioFile(created, { includeSignedUrl: true, allowPrivate: true });
}

export async function listPortfolioFiles(userId: string, portfolioId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const files = await findRecords("portfolioFiles", { ownerId: userId, portfolioId }, { sort: { createdAt: -1 } });
  const presented = await Promise.all(files.map((file) => presentPortfolioFile(file, { includeSignedUrl: true, allowPrivate: true })));
  return presented.filter(Boolean);
}

export async function updatePortfolioFileVisibility(userId: string, portfolioId: string, fileId: string, visibility: any) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  const updated = await updateRecord("portfolioFiles", String(file._id), { visibility: normalizeVisibility(visibility) });
  return presentPortfolioFile(updated, { includeSignedUrl: true, allowPrivate: true });
}

export async function updatePortfolioFile(userId: string, portfolioId: string, fileId: string, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  const updatePayload: any = {};
  if ("visibility" in input) updatePayload.visibility = normalizeVisibility(input.visibility);
  if ("projectId" in input) updatePayload.projectId = input.projectId ? String(input.projectId) : "";
  if ("proofMappingId" in input) updatePayload.proofMappingId = input.proofMappingId ? String(input.proofMappingId) : "";
  if ("fileType" in input) updatePayload.fileType = normalizeFileType(input.fileType);
  const updated = await updateRecord("portfolioFiles", String(file._id), updatePayload);
  return presentPortfolioFile(updated, { includeSignedUrl: true, allowPrivate: true });
}

export async function getPortfolioFileSignedUrl(userId: string, portfolioId: string, fileId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  return presentPortfolioFile(file, { includeSignedUrl: true, allowPrivate: true });
}

export async function deletePortfolioFile(userId: string, portfolioId: string, fileId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  await deleteFile(file.storageKey);
  await deleteRecord("portfolioFiles", String(file._id));
  return { deleted: true, fileId };
}

export function getPortfolioStorageStatus() {
  return getStorageStatus();
}
