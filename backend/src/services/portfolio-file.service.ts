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
import {
  FileScanStatus,
  getFileScanningProviderStatus,
  isFilePublicEligible,
  normalizeScanStatus,
  scanPortfolioProofFileBuffer
} from "./file-scanning.service.js";
import { listRecentPortfolioFileActivity, recordPortfolioFileAuditEvent } from "./portfolio-file-audit.service.js";

const fileTypes = new Set(["resumePdf", "portfolioPdf", "screenshot", "proofFile", "other"]);
const storageProviders = new Set(["local", "s3", "r2"]);
const retentionStatuses = new Set(["active", "scheduled_for_delete", "deleted", "retained_for_audit"]);
const reviewStatuses = new Set(["not_reviewed", "reviewed", "needs_attention"]);

function normalizeFileType(value: any) {
  return fileTypes.has(value) ? value : "other";
}

function normalizeVisibility(value: any): "private" | "publicApproved" {
  return value === "publicApproved" ? "publicApproved" : "private";
}

function normalizeRetentionStatus(value: any): "active" | "scheduled_for_delete" | "deleted" | "retained_for_audit" {
  return retentionStatuses.has(value) ? value : "active";
}

function normalizeReviewStatus(value: any): "not_reviewed" | "reviewed" | "needs_attention" {
  return reviewStatuses.has(value) ? value : "not_reviewed";
}

function safeOwnerText(value: any, maxLength = 500) {
  return String(value || "")
    .replace(/[A-Za-z]:\\[^\s]+/g, "[local-path-redacted]")
    .replace(/https?:\/\/[^\s?]+(\?[^\s]*)?/g, "[url-redacted]")
    .trim()
    .slice(0, maxLength);
}

function normalizeProvider(value: any): "local" | "s3" | "r2" {
  const provider = storageProviders.has(value) ? value : getProvider();
  return provider === "s3" || provider === "r2" ? provider : "local";
}

function normalizeScanProvider(value: any) {
  return String(value || "local-validation").trim() || "local-validation";
}

function normalizeScanSummary(value: any, scanStatus: FileScanStatus) {
  const summary = String(value || "").trim();
  if (summary) return summary;
  if (scanStatus === "local_validated") return "Local validation passed. Provider malware scanning is not configured.";
  if (scanStatus === "clean") return "Provider malware scan returned clean.";
  if (scanStatus === "blocked") return "Provider malware scan blocked this file.";
  if (scanStatus === "failed") return "Provider malware scan failed. File remains private.";
  if (scanStatus === "provider_pending") return "Provider malware scan is pending.";
  return "File has not been scanned.";
}

function scanPayloadFrom(input: any = {}) {
  const scanStatus = normalizeScanStatus(input.scanStatus);
  const statusEligible = isFilePublicEligible(scanStatus);
  return {
    scanStatus,
    scanProvider: normalizeScanProvider(input.scanProvider),
    scannedAt: input.scannedAt ? String(input.scannedAt) : new Date().toISOString(),
    scanSummary: normalizeScanSummary(input.scanSummary, scanStatus),
    blockedReason: String(input.blockedReason || ""),
    isPublicEligible: statusEligible && (typeof input.isPublicEligible === "boolean" ? input.isPublicEligible : true)
  };
}

function assertPublicEligible(file: any) {
  const scanStatus = normalizeScanStatus(file?.scanStatus);
  const eligible = isFilePublicEligible(scanStatus) && (typeof file?.isPublicEligible === "boolean" ? file.isPublicEligible : true);
  if (!eligible || normalizeRetentionStatus(file?.retentionStatus) !== "active") {
    throw new ApiError(400, "This proof file cannot be public until scanning is eligible and retention status is active.");
  }
}

function isRetentionPublicEligible(file: any) {
  return normalizeRetentionStatus(file?.retentionStatus) === "active";
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
    ...scanPayloadFrom(raw),
    retentionStatus: normalizeRetentionStatus(raw.retentionStatus),
    retentionReason: safeOwnerText(raw.retentionReason, 240),
    deleteRequestedAt: raw.deleteRequestedAt ? String(raw.deleteRequestedAt) : "",
    deleteCompletedAt: raw.deleteCompletedAt ? String(raw.deleteCompletedAt) : "",
    lastReviewedAt: raw.lastReviewedAt ? String(raw.lastReviewedAt) : "",
    reviewStatus: normalizeReviewStatus(raw.reviewStatus),
    ownerNote: safeOwnerText(raw.ownerNote),
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
    scanStatus: safeFile.scanStatus,
    scanProvider: safeFile.scanProvider,
    scannedAt: safeFile.scannedAt,
    scanSummary: safeFile.scanSummary,
    blockedReason: safeFile.blockedReason,
    isPublicEligible: safeFile.isPublicEligible,
    retentionStatus: safeFile.retentionStatus,
    retentionReason: safeFile.retentionReason,
    deleteRequestedAt: safeFile.deleteRequestedAt,
    deleteCompletedAt: safeFile.deleteCompletedAt,
    lastReviewedAt: safeFile.lastReviewedAt,
    reviewStatus: safeFile.reviewStatus,
    ownerNote: safeFile.ownerNote,
    scanningProviderStatus: getFileScanningProviderStatus().status,
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
    .filter((file): file is NonNullable<ReturnType<typeof sanitizePortfolioFileReference>> => Boolean(file && file.visibility === "publicApproved" && file.isPublicEligible && isRetentionPublicEligible(file)));

  const resolved = await Promise.all(publicFiles.map((file) => presentPortfolioFile(file, { includeSignedUrl: true })));
  return resolved.filter(Boolean).map((file: any) => {
    const {
      storageKey,
      retentionStatus,
      retentionReason,
      deleteRequestedAt,
      deleteCompletedAt,
      lastReviewedAt,
      reviewStatus,
      ownerNote,
      ...publicFile
    } = file;
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

async function recordScanAuditForFile(file: any, scanStatus: FileScanStatus) {
  if (scanStatus === "not_scanned") return;
  await recordPortfolioFileAuditEvent({
    ownerId: String(file.ownerId),
    portfolioId: String(file.portfolioId),
    fileId: String(file.fileId),
    projectId: file.projectId,
    proofMappingId: file.proofMappingId,
    eventType: scanStatus === "local_validated" ? "local_validated" : "scan_status_changed",
    previousStatus: "not_scanned",
    newStatus: scanStatus,
    actor: "system",
    summary: scanStatus === "local_validated"
      ? "Local validation completed without logging file contents."
      : "Provider scan status changed without logging file contents."
  });
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

  const scanPayload = scanPayloadFrom(input);
  if (safeInput.visibility === "publicApproved" && !scanPayload.isPublicEligible) {
    throw new ApiError(400, "This proof file cannot be public until scanning is clean or local validation is eligible.");
  }

  const created = await createRecord("portfolioFiles", {
    ...safeInput,
    ownerId: userId,
    portfolioId,
    fileId: safeInput.fileId || randomUUID(),
    ...scanPayload
  });

  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId: created.fileId,
    projectId: created.projectId,
    proofMappingId: created.proofMappingId,
    eventType: "uploaded",
    newVisibility: created.visibility,
    actor: "user",
    summary: "Proof file metadata was registered in the owner-scoped vault. File contents were not logged."
  });
  if (created.visibility === "publicApproved") {
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId: created.fileId,
      projectId: created.projectId,
      proofMappingId: created.proofMappingId,
      eventType: "public_approved",
      newVisibility: created.visibility,
      actor: "user"
    });
  }
  await recordScanAuditForFile(created, scanPayload.scanStatus);

  return presentPortfolioFile(created, { includeSignedUrl: true, allowPrivate: true });
}

export async function uploadPortfolioProofFile(userId: string, portfolioId: string, file: Express.Multer.File | undefined, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  if (!file?.buffer) {
    throw new ApiError(400, "Proof file is required");
  }

  validatePortfolioProofFileBuffer(file.buffer, file.originalname, file.mimetype);
  const scan = await scanPortfolioProofFileBuffer(file);

  const fileId = randomUUID();
  const safeName = sanitizeFilename(file.originalname);
  const requestedVisibility = normalizeVisibility(input.visibility);
  const visibility = scan.isPublicEligible ? requestedVisibility : "private";
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
    visibility,
    retentionStatus: "active",
    retentionReason: "",
    reviewStatus: "not_reviewed",
    ownerNote: "",
    ...scan
  });

  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId,
    projectId: created.projectId,
    proofMappingId: created.proofMappingId,
    eventType: "uploaded",
    newVisibility: visibility,
    actor: "user",
    summary: "Proof file was uploaded into the owner-scoped vault. File contents and storage paths were not logged."
  });
  if (visibility === "publicApproved") {
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId,
      projectId: created.projectId,
      proofMappingId: created.proofMappingId,
      eventType: "public_approved",
      newVisibility: visibility,
      actor: "user"
    });
  }
  await recordScanAuditForFile(created, scan.scanStatus);

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
  const nextVisibility = normalizeVisibility(visibility);
  if (nextVisibility === "publicApproved") assertPublicEligible(file);
  const updated = await updateRecord("portfolioFiles", String(file._id), { visibility: nextVisibility });
  if (file.visibility !== nextVisibility) {
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId,
      projectId: file.projectId,
      proofMappingId: file.proofMappingId,
      eventType: "visibility_changed",
      previousVisibility: file.visibility,
      newVisibility: nextVisibility,
      actor: "user"
    });
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId,
      projectId: file.projectId,
      proofMappingId: file.proofMappingId,
      eventType: nextVisibility === "publicApproved" ? "public_approved" : "public_revoked",
      previousVisibility: file.visibility,
      newVisibility: nextVisibility,
      actor: "user"
    });
  }
  return presentPortfolioFile(updated, { includeSignedUrl: true, allowPrivate: true });
}

export async function updatePortfolioFile(userId: string, portfolioId: string, fileId: string, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  const updatePayload: any = {};
  if ("visibility" in input) {
    updatePayload.visibility = normalizeVisibility(input.visibility);
    if (updatePayload.visibility === "publicApproved") assertPublicEligible(file);
  }
  if ("projectId" in input) updatePayload.projectId = input.projectId ? String(input.projectId) : "";
  if ("proofMappingId" in input) updatePayload.proofMappingId = input.proofMappingId ? String(input.proofMappingId) : "";
  if ("fileType" in input) updatePayload.fileType = normalizeFileType(input.fileType);
  const updated = await updateRecord("portfolioFiles", String(file._id), updatePayload);
  if ("visibility" in updatePayload && file.visibility !== updatePayload.visibility) {
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId,
      projectId: updated?.projectId || file.projectId,
      proofMappingId: updated?.proofMappingId || file.proofMappingId,
      eventType: "visibility_changed",
      previousVisibility: file.visibility,
      newVisibility: updatePayload.visibility,
      actor: "user"
    });
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId,
      projectId: updated?.projectId || file.projectId,
      proofMappingId: updated?.proofMappingId || file.proofMappingId,
      eventType: updatePayload.visibility === "publicApproved" ? "public_approved" : "public_revoked",
      previousVisibility: file.visibility,
      newVisibility: updatePayload.visibility,
      actor: "user"
    });
  }
  return presentPortfolioFile(updated, { includeSignedUrl: true, allowPrivate: true });
}

export async function getPortfolioFileSignedUrl(userId: string, portfolioId: string, fileId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  if (normalizeRetentionStatus(file.retentionStatus) === "deleted") {
    throw new ApiError(404, "Portfolio proof file not found");
  }
  const presented = await presentPortfolioFile(file, { includeSignedUrl: true, allowPrivate: true });
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId,
    projectId: file.projectId,
    proofMappingId: file.proofMappingId,
    eventType: "signed_url_generated",
    actor: "user",
    summary: "Short-lived proof file URL was generated for the owner. Full token and private storage URL were not logged."
  });
  return presented;
}

export async function reviewPortfolioFileRetention(userId: string, portfolioId: string, fileId: string, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  const requestedRetention = "retentionStatus" in input ? normalizeRetentionStatus(input.retentionStatus) : normalizeRetentionStatus(file.retentionStatus);
  if (requestedRetention === "deleted") {
    throw new ApiError(400, "Use the confirmed delete flow to delete a proof file.");
  }
  const retentionStatus = requestedRetention;
  const updatePayload: any = {
    retentionStatus,
    retentionReason: safeOwnerText(input.retentionReason || file.retentionReason, 240),
    reviewStatus: normalizeReviewStatus(input.reviewStatus || "reviewed"),
    ownerNote: safeOwnerText(input.ownerNote ?? file.ownerNote),
    lastReviewedAt: new Date().toISOString()
  };
  if (retentionStatus !== "active") {
    updatePayload.visibility = "private";
  }
  const updated = await updateRecord("portfolioFiles", String(file._id), updatePayload);
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId,
    projectId: file.projectId,
    proofMappingId: file.proofMappingId,
    eventType: "retention_reviewed",
    previousVisibility: file.visibility,
    newVisibility: updated?.visibility || file.visibility,
    actor: "user",
    summary: "Owner reviewed proof file retention settings. File contents, storage paths, and private URLs were not logged."
  });
  if (file.visibility === "publicApproved" && updatePayload.visibility === "private") {
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId,
      projectId: file.projectId,
      proofMappingId: file.proofMappingId,
      eventType: "public_revoked",
      previousVisibility: file.visibility,
      newVisibility: "private",
      actor: "user"
    });
  }
  return presentPortfolioFile(updated, { includeSignedUrl: true, allowPrivate: true });
}

export async function requestPortfolioFileDeletion(userId: string, portfolioId: string, fileId: string, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  const now = new Date().toISOString();
  const updated = await updateRecord("portfolioFiles", String(file._id), {
    retentionStatus: "scheduled_for_delete",
    retentionReason: safeOwnerText(input.retentionReason || input.reason || "Owner requested deletion.", 240),
    deleteRequestedAt: now,
    lastReviewedAt: now,
    reviewStatus: "needs_attention",
    visibility: "private"
  });
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId,
    projectId: file.projectId,
    proofMappingId: file.proofMappingId,
    eventType: "delete_requested",
    previousVisibility: file.visibility,
    newVisibility: "private",
    actor: "user",
    summary: "Owner requested proof file deletion. File contents, storage paths, and signed URLs were not logged."
  });
  if (file.visibility === "publicApproved") {
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId,
      projectId: file.projectId,
      proofMappingId: file.proofMappingId,
      eventType: "public_revoked",
      previousVisibility: file.visibility,
      newVisibility: "private",
      actor: "user"
    });
  }
  return presentPortfolioFile(updated, { includeSignedUrl: true, allowPrivate: true });
}

export async function detachPortfolioFileMetadata(userId: string, portfolioId: string, fileId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId,
    projectId: file.projectId,
    proofMappingId: file.proofMappingId,
    eventType: "detach_requested",
    actor: "user",
    summary: "Owner requested detaching this proof file while keeping the private file metadata and stored object."
  });
  const updated = await updateRecord("portfolioFiles", String(file._id), {
    projectId: "",
    proofMappingId: "",
    lastReviewedAt: new Date().toISOString(),
    reviewStatus: normalizeReviewStatus(file.reviewStatus) === "not_reviewed" ? "reviewed" : normalizeReviewStatus(file.reviewStatus)
  });
  return presentPortfolioFile(updated, { includeSignedUrl: true, allowPrivate: true });
}

function exportFileSummary(file: any) {
  const safeFile = sanitizePortfolioFileReference(file);
  if (!safeFile) return null;
  return {
    fileId: safeFile.fileId,
    portfolioId: safeFile.portfolioId,
    projectId: safeFile.projectId,
    proofMappingId: safeFile.proofMappingId,
    fileType: safeFile.fileType,
    originalFilename: safeFile.originalFilename,
    mimeType: safeFile.mimeType,
    size: safeFile.size,
    visibility: safeFile.visibility,
    scanStatus: safeFile.scanStatus,
    scanProvider: safeFile.scanProvider,
    scanSummary: safeFile.scanSummary,
    blockedReason: safeFile.blockedReason,
    isPublicEligible: safeFile.isPublicEligible,
    retentionStatus: safeFile.retentionStatus,
    retentionReason: safeFile.retentionReason,
    deleteRequestedAt: safeFile.deleteRequestedAt,
    deleteCompletedAt: safeFile.deleteCompletedAt,
    lastReviewedAt: safeFile.lastReviewedAt,
    reviewStatus: safeFile.reviewStatus,
    ownerNote: safeFile.ownerNote,
    createdAt: safeFile.createdAt,
    updatedAt: safeFile.updatedAt
  };
}

export async function getPortfolioProofFileExportSummary(userId: string, portfolioId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId: "portfolio-proof-metadata-export",
    eventType: "export_requested",
    actor: "user",
    summary: "Owner requested proof-file metadata export review. No binaries or signed URL secrets were included."
  });
  const [files, recentAuditEvents] = await Promise.all([
    findRecords("portfolioFiles", { ownerId: userId, portfolioId }, { sort: { createdAt: -1 } }),
    listRecentPortfolioFileActivity(userId, portfolioId, { limit: 50 })
  ]);
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId: "portfolio-proof-metadata-export",
    eventType: "export_generated_metadata",
    actor: "system",
    summary: "Proof-file metadata export summary was generated without file binaries, storage keys, signed tokens, private bucket URLs, or local paths."
  });
  return {
    generatedAt: new Date().toISOString(),
    portfolioId,
    binaryExportStatus: "metadata_export_ready",
    binaryExportNote: "Metadata export ready; binary export requires secure archive workflow.",
    files: files.map(exportFileSummary).filter(Boolean),
    recentAuditEvents
  };
}

export async function deletePortfolioFile(userId: string, portfolioId: string, fileId: string, options: { confirmed?: boolean; actor?: "user" | "system"; reason?: string } = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  if (!options.confirmed) {
    throw new ApiError(400, "Confirm deletion before removing a proof file. Use detach to keep the private file but remove portfolio references.");
  }
  const file = await findOwnedPortfolioFile(userId, portfolioId, fileId);
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId,
    projectId: file.projectId,
    proofMappingId: file.proofMappingId,
    eventType: "delete_requested",
    previousVisibility: file.visibility,
    newVisibility: "private",
    actor: options.actor || "user",
    summary: safeOwnerText(options.reason || "Confirmed delete requested. File contents and storage paths were not logged.", 240)
  });
  await updateRecord("portfolioFiles", String(file._id), {
    retentionStatus: "deleted",
    visibility: "private",
    deleteCompletedAt: new Date().toISOString(),
    retentionReason: safeOwnerText(options.reason || file.retentionReason || "Owner confirmed deletion.", 240),
    reviewStatus: "reviewed"
  });
  await deleteFile(file.storageKey);
  await deleteRecord("portfolioFiles", String(file._id));
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId,
    projectId: file.projectId,
    proofMappingId: file.proofMappingId,
    eventType: "delete_completed",
    previousVisibility: file.visibility,
    newVisibility: "private",
    actor: options.actor || "user",
    summary: "Proof file was deleted. File contents and storage paths were not logged."
  });
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId,
    projectId: file.projectId,
    proofMappingId: file.proofMappingId,
    eventType: "deleted",
    previousVisibility: file.visibility,
    newVisibility: "private",
    actor: options.actor || "user",
    summary: "Legacy deleted event retained as minimal proof-file deletion history without file contents."
  });
  return { deleted: true, fileId };
}

export function getPortfolioStorageStatus() {
  return getStorageStatus();
}

export function getPortfolioScanningStatus() {
  return getFileScanningProviderStatus();
}
