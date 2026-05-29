import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import {
  deleteFile,
  downloadFile,
  getProvider,
  getSignedUrl,
  getSignedUrlTtlSeconds,
  getStorageStatus,
  normalizeStorageKey,
  uploadFile
} from "./storage.service.js";
import { normalizeScanStatus, isFilePublicEligible } from "./file-scanning.service.js";
import { recordPortfolioFileAuditEvent } from "./portfolio-file-audit.service.js";

const exportStatuses = new Set(["requested", "preparing", "ready", "failed", "expired", "deleted"]);
const MAX_ARCHIVE_FILE_COUNT = 25;
const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;

function safeText(value: any, maxLength = 500) {
  return String(value || "")
    .replace(/[A-Za-z]:\\[^\s]+/g, "[local-path-redacted]")
    .replace(/https?:\/\/[^\s?]+(\?[^\s]*)?/g, "[url-redacted]")
    .trim()
    .slice(0, maxLength);
}

function sanitizeFilename(filename: string) {
  return String(filename || "proof-file")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "proof-file";
}

function normalizeRequestedFileIds(value: any) {
  const values = Array.isArray(value) ? value : [];
  return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
}

function normalizeStatus(value: any) {
  return exportStatuses.has(value) ? value : "requested";
}

async function assertPortfolioOwner(userId: string, portfolioId: string) {
  const portfolio = await findRecordById("portfolios", portfolioId);
  if (!portfolio || String(portfolio.userId) !== String(userId)) {
    throw new ApiError(404, "Portfolio not found");
  }
  return portfolio;
}

async function findOwnedExportRequest(userId: string, portfolioId: string, exportId: string) {
  const request = await findOneRecord("portfolioFileExportRequests", { ownerId: userId, portfolioId, exportId });
  if (!request) throw new ApiError(404, "Proof file export request not found");
  return request;
}

function fileEligibility(file: any) {
  const scanStatus = normalizeScanStatus(file?.scanStatus);
  const retentionStatus = String(file?.retentionStatus || "active");
  if (retentionStatus !== "active") return { eligible: false, reason: `Retention status is ${retentionStatus}.` };
  if (!isFilePublicEligible(scanStatus) || file?.isPublicEligible === false) return { eligible: false, reason: `Scan status is ${scanStatus}; file is not export-eligible.` };
  try {
    normalizeStorageKey(file?.storageKey);
  } catch {
    return { eligible: false, reason: "Storage key is invalid or unavailable." };
  }
  return { eligible: true, reason: "Eligible for owner-only archive export." };
}

function publicFileSummary(file: any, extra: Record<string, any> = {}) {
  return {
    fileId: String(file.fileId || ""),
    projectId: String(file.projectId || ""),
    proofMappingId: String(file.proofMappingId || ""),
    fileType: String(file.fileType || "other"),
    originalFilename: String(file.originalFilename || ""),
    mimeType: String(file.mimeType || "application/octet-stream"),
    size: Number(file.size || 0),
    visibility: String(file.visibility || "private"),
    scanStatus: String(file.scanStatus || "not_scanned"),
    isPublicEligible: Boolean(file.isPublicEligible),
    retentionStatus: String(file.retentionStatus || "active"),
    reviewStatus: String(file.reviewStatus || "not_reviewed"),
    ...extra
  };
}

function presentExportRequest(record: any, options: { downloadUrl?: string } = {}) {
  return {
    exportId: String(record.exportId),
    portfolioId: String(record.portfolioId),
    status: normalizeStatus(record.status),
    requestedFileIds: Array.isArray(record.requestedFileIds) ? record.requestedFileIds.map(String) : [],
    includedFileIds: Array.isArray(record.includedFileIds) ? record.includedFileIds.map(String) : [],
    excludedFiles: Array.isArray(record.excludedFiles) ? record.excludedFiles.map((item: any) => ({
      fileId: String(item.fileId || ""),
      originalFilename: String(item.originalFilename || ""),
      reason: safeText(item.reason, 240)
    })) : [],
    includedFileCount: Number(record.includedFileCount || 0),
    excludedFileCount: Number(record.excludedFileCount || 0),
    archiveProvider: record.archiveProvider === "s3" || record.archiveProvider === "r2" ? record.archiveProvider : "local",
    archiveFilename: String(record.archiveFilename || ""),
    expiresAt: record.expiresAt || "",
    createdAt: record.createdAt || "",
    updatedAt: record.updatedAt || "",
    failureReason: safeText(record.failureReason, 240),
    safeSummary: safeText(record.safeSummary, 500),
    storageStatus: getStorageStatus().status,
    storageStatusLabel: getStorageStatus().label,
    signedUrlExpiresInSeconds: getSignedUrlTtlSeconds(),
    isLocalFallback: getStorageStatus().localFallback,
    ...(options.downloadUrl ? { downloadUrl: options.downloadUrl } : {})
  };
}

async function loadCandidateFiles(userId: string, portfolioId: string, requestedFileIds: string[]) {
  const query: Record<string, any> = { ownerId: userId, portfolioId };
  if (requestedFileIds.length) query.fileId = { $in: requestedFileIds };
  const files = await findRecords("portfolioFiles", query, { sort: { createdAt: -1 } });
  const foundIds = new Set(files.map((file) => String(file.fileId)));
  const missing = requestedFileIds.filter((fileId) => !foundIds.has(fileId)).map((fileId) => ({
    fileId,
    originalFilename: "",
    reason: "File was not found in this portfolio."
  }));
  return { files, missing };
}

export async function previewPortfolioProofArchiveExport(userId: string, portfolioId: string, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  const requestedFileIds = normalizeRequestedFileIds(input.requestedFileIds);
  const { files, missing } = await loadCandidateFiles(userId, portfolioId, requestedFileIds);
  const selectedFiles = [...files.map((file) => {
    const eligibility = fileEligibility(file);
    return publicFileSummary(file, {
      selected: true,
      eligible: eligibility.eligible,
      exclusionReason: eligibility.eligible ? "" : eligibility.reason
    });
  }), ...missing.map((item) => ({
    fileId: item.fileId,
    originalFilename: "",
    selected: true,
    eligible: false,
    exclusionReason: item.reason,
    visibility: "",
    scanStatus: "",
    retentionStatus: "",
    reviewStatus: "",
    size: 0
  }))];
  const included = selectedFiles.filter((file: any) => file.eligible);
  const excluded = selectedFiles.filter((file: any) => !file.eligible);
  return {
    portfolioId,
    generatedAt: new Date().toISOString(),
    confirmationRequired: true,
    selectedFiles,
    includedFileCount: included.length,
    excludedFileCount: excluded.length,
    signedUrlExpiresInSeconds: getSignedUrlTtlSeconds(),
    storageStatus: getStorageStatus().status,
    storageStatusLabel: getStorageStatus().label,
    warning: "Binary export is owner-only. Public portfolios never expose private archive links."
  };
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function buildZip(entries: Array<{ name: string; data: Buffer }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = entry.data;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }

  const centralStart = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function archiveEntryName(file: any, index: number) {
  const baseName = sanitizeFilename(file.originalFilename || `${file.fileId}.bin`);
  return `proof-files/${String(index + 1).padStart(2, "0")}-${file.fileId}-${baseName}`;
}

async function prepareArchiveBuffer(exportId: string, portfolioId: string, files: any[], excludedFiles: any[]) {
  if (files.length > MAX_ARCHIVE_FILE_COUNT) {
    throw new ApiError(400, `A proof archive can include up to ${MAX_ARCHIVE_FILE_COUNT} files at a time.`);
  }
  const totalSize = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  if (totalSize > MAX_ARCHIVE_BYTES) {
    throw new ApiError(400, "Selected proof files exceed the safe archive size limit.");
  }

  const fileEntries: Array<{ name: string; data: Buffer; file: any }> = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const data = await downloadFile(file.storageKey);
    fileEntries.push({ name: archiveEntryName(file, index), data, file });
  }

  const manifest = {
    exportId,
    portfolioId,
    generatedAt: new Date().toISOString(),
    privacy: "Owner-only archive. Public portfolios never expose archive links or export metadata.",
    storage: {
      status: getStorageStatus().status,
      label: getStorageStatus().label,
      localFallback: getStorageStatus().localFallback
    },
    includedFiles: fileEntries.map((entry) => publicFileSummary(entry.file, { archiveEntryName: entry.name })),
    excludedFiles: excludedFiles.map((file) => ({
      fileId: String(file.fileId || ""),
      originalFilename: String(file.originalFilename || ""),
      reason: safeText(file.reason, 240)
    }))
  };

  return buildZip([
    { name: "manifest.json", data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8") },
    ...fileEntries.map((entry) => ({ name: entry.name, data: entry.data }))
  ]);
}

export async function createPortfolioProofArchiveExport(userId: string, portfolioId: string, input: any = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  if (input.confirmExport !== true) {
    throw new ApiError(400, "Confirm the owner-only proof file archive export before generating it.");
  }

  const requestedFileIds = normalizeRequestedFileIds(input.requestedFileIds);
  const { files, missing } = await loadCandidateFiles(userId, portfolioId, requestedFileIds);
  const includedFiles = files.filter((file) => fileEligibility(file).eligible);
  const excludedFiles = [
    ...files.filter((file) => !fileEligibility(file).eligible).map((file) => ({
      fileId: String(file.fileId),
      originalFilename: String(file.originalFilename || ""),
      reason: fileEligibility(file).reason
    })),
    ...missing
  ];

  if (!includedFiles.length) {
    throw new ApiError(400, "No eligible proof files were selected for archive export.");
  }

  const exportId = randomUUID();
  const requested = await createRecord("portfolioFileExportRequests", {
    exportId,
    ownerId: userId,
    portfolioId,
    status: "preparing",
    requestedFileIds,
    includedFileIds: includedFiles.map((file) => String(file.fileId)),
    excludedFiles,
    includedFileCount: includedFiles.length,
    excludedFileCount: excludedFiles.length,
    archiveProvider: getProvider(),
    archiveFilename: `proof-files-${exportId}.zip`,
    safeSummary: "Owner confirmed proof-file binary archive export. File contents are stored only inside the generated archive object.",
    expiresAt: new Date(Date.now() + getSignedUrlTtlSeconds() * 1000).toISOString()
  });

  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId: exportId,
    eventType: "binary_export_requested",
    actor: "user",
    summary: "Owner confirmed proof-file binary archive export. File contents, private paths, and signed URL secrets were not logged."
  });

  try {
    const archiveBuffer = await prepareArchiveBuffer(exportId, portfolioId, includedFiles, excludedFiles);
    const archiveStorageKey = await uploadFile(`portfolio-proof-exports/${userId}/${portfolioId}/${exportId}.zip`, archiveBuffer, "application/zip");
    const updated = await updateRecord("portfolioFileExportRequests", String(requested._id), {
      status: "ready",
      archiveStorageKey,
      archiveProvider: getProvider(),
      safeSummary: `Owner-only proof archive is ready with ${includedFiles.length} included file(s) and ${excludedFiles.length} excluded file(s).`
    });
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId: exportId,
      eventType: "binary_export_prepared",
      actor: "system",
      summary: "Proof file archive was prepared for the owner without logging archive storage paths or file contents."
    });
    return presentExportRequest(updated);
  } catch (error: any) {
    const failureReason = safeText(error?.message || "Archive generation failed.", 240);
    const failed = await updateRecord("portfolioFileExportRequests", String(requested._id), {
      status: "failed",
      failureReason,
      safeSummary: "Proof archive generation failed without exposing file contents."
    });
    await recordPortfolioFileAuditEvent({
      ownerId: userId,
      portfolioId,
      fileId: exportId,
      eventType: "binary_export_failed",
      actor: "system",
      summary: "Proof archive generation failed. File contents, private paths, and signed URL secrets were not logged."
    });
    return presentExportRequest(failed);
  }
}

async function markExpiredIfNeeded(request: any) {
  if (normalizeStatus(request.status) !== "ready") return request;
  const expiresAt = request.expiresAt ? new Date(request.expiresAt).getTime() : 0;
  if (expiresAt && expiresAt <= Date.now()) {
    const updated = await updateRecord("portfolioFileExportRequests", String(request._id), {
      status: "expired",
      safeSummary: "Owner-only archive expired by metadata. Generate a new export if needed."
    });
    await recordPortfolioFileAuditEvent({
      ownerId: String(request.ownerId),
      portfolioId: String(request.portfolioId),
      fileId: String(request.exportId),
      eventType: "binary_export_expired",
      actor: "system",
      summary: "Proof file archive expired. Signed URL secrets and storage paths were not logged."
    });
    return updated;
  }
  return request;
}

export async function listPortfolioProofArchiveExports(userId: string, portfolioId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const requests = await findRecords("portfolioFileExportRequests", { ownerId: userId, portfolioId }, { sort: { createdAt: -1 }, limit: 20 });
  const updated = await Promise.all(requests.map(markExpiredIfNeeded));
  return updated.map((request) => presentExportRequest(request));
}

export async function getPortfolioProofArchiveExport(userId: string, portfolioId: string, exportId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const request = await markExpiredIfNeeded(await findOwnedExportRequest(userId, portfolioId, exportId));
  return presentExportRequest(request);
}

export async function getPortfolioProofArchiveSignedUrl(userId: string, portfolioId: string, exportId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const request = await markExpiredIfNeeded(await findOwnedExportRequest(userId, portfolioId, exportId));
  if (normalizeStatus(request.status) === "expired") {
    throw new ApiError(410, "Proof file archive export has expired. Generate a new owner-only export.");
  }
  if (normalizeStatus(request.status) !== "ready" || !request.archiveStorageKey) {
    throw new ApiError(400, "Proof file archive is not ready for download.");
  }
  const downloadUrl = await getSignedUrl(request.archiveStorageKey);
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId: exportId,
    eventType: "binary_export_download_link_generated",
    actor: "user",
    summary: "Short-lived proof archive download link generated for the owner. Full signed URL secrets were not logged."
  });
  return presentExportRequest(request, { downloadUrl });
}

export async function deletePortfolioProofArchiveExport(userId: string, portfolioId: string, exportId: string) {
  await assertPortfolioOwner(userId, portfolioId);
  const request = await findOwnedExportRequest(userId, portfolioId, exportId);
  if (request.archiveStorageKey) {
    await deleteFile(request.archiveStorageKey);
  }
  const updated = await updateRecord("portfolioFileExportRequests", String(request._id), {
    status: "deleted",
    archiveStorageKey: "",
    safeSummary: "Owner-only proof archive was deleted or revoked. Minimal metadata remains for review."
  });
  await recordPortfolioFileAuditEvent({
    ownerId: userId,
    portfolioId,
    fileId: exportId,
    eventType: "binary_export_deleted",
    actor: "user",
    summary: "Proof archive was deleted or revoked. File contents, storage paths, and signed URL secrets were not logged."
  });
  return presentExportRequest(updated);
}
