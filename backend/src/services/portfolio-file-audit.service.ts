import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords } from "../utils/repository.js";

export type PortfolioFileAuditEventType =
  | "uploaded"
  | "local_validated"
  | "scan_status_changed"
  | "visibility_changed"
  | "public_approved"
  | "public_revoked"
  | "signed_url_generated"
  | "downloaded"
  | "attached_to_project"
  | "detached_from_project"
  | "deleted"
  | "retention_reviewed"
  | "delete_requested"
  | "delete_completed"
  | "detach_requested"
  | "export_requested"
  | "export_generated_metadata"
  | "binary_export_requested"
  | "binary_export_prepared"
  | "binary_export_failed"
  | "binary_export_download_link_generated"
  | "binary_export_expired"
  | "binary_export_deleted";

type Actor = "user" | "system";

const eventTypes = new Set<PortfolioFileAuditEventType>([
  "uploaded",
  "local_validated",
  "scan_status_changed",
  "visibility_changed",
  "public_approved",
  "public_revoked",
  "signed_url_generated",
  "downloaded",
  "attached_to_project",
  "detached_from_project",
  "deleted",
  "retention_reviewed",
  "delete_requested",
  "delete_completed",
  "detach_requested",
  "export_requested",
  "export_generated_metadata",
  "binary_export_requested",
  "binary_export_prepared",
  "binary_export_failed",
  "binary_export_download_link_generated",
  "binary_export_expired",
  "binary_export_deleted"
]);

function normalizeEventType(value: any): PortfolioFileAuditEventType | null {
  return eventTypes.has(value) ? value : null;
}

function normalizeActor(value: any): Actor {
  return value === "system" ? "system" : "user";
}

function safeValue(value: any) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/[A-Za-z]:\\[^\s]+/g, "[local-path-redacted]")
    .replace(/https?:\/\/[^\s?]+(\?[^\s]*)?/g, (url) => {
      try {
        const parsed = new URL(url);
        return `${parsed.origin}${parsed.pathname}${parsed.search ? "?[query-redacted]" : ""}`;
      } catch {
        return "[url-redacted]";
      }
    })
    .slice(0, 240);
}

function defaultSummary(eventType: PortfolioFileAuditEventType, actor: Actor) {
  const actorLabel = actor === "system" ? "System" : "User";
  switch (eventType) {
    case "uploaded":
      return "Proof file was added to the private portfolio file vault.";
    case "local_validated":
      return "Local validation checked file type, size, extension, and signature.";
    case "scan_status_changed":
      return "Proof file scan status changed. File contents were not logged.";
    case "visibility_changed":
      return `${actorLabel} changed proof file visibility.`;
    case "public_approved":
      return "Proof file was explicitly approved for public portfolio display.";
    case "public_revoked":
      return "Proof file public approval was revoked.";
    case "signed_url_generated":
      return "Short-lived signed URL was generated. Secret tokens were not stored.";
    case "downloaded":
      return "Proof file download was requested through an owned app flow.";
    case "attached_to_project":
      return "Proof file was attached to a portfolio project or skill proof mapping.";
    case "detached_from_project":
      return "Proof file was detached from a portfolio project or skill proof mapping.";
    case "deleted":
      return "Proof file metadata and storage object were deleted or detached from the vault.";
    case "retention_reviewed":
      return "Owner reviewed proof file retention metadata. File contents were not logged.";
    case "delete_requested":
      return "Owner requested proof file deletion. File contents and storage paths were not logged.";
    case "delete_completed":
      return "Proof file deletion completed. Minimal audit history was retained.";
    case "detach_requested":
      return "Owner requested detaching the proof file from portfolio proof cards.";
    case "export_requested":
      return "Owner requested a proof file metadata export summary.";
    case "export_generated_metadata":
      return "Metadata export summary was generated without binaries, signed tokens, or private paths.";
    case "binary_export_requested":
      return "Owner requested a proof file binary export archive.";
    case "binary_export_prepared":
      return "Proof file binary export archive was prepared without logging file contents or storage paths.";
    case "binary_export_failed":
      return "Proof file binary export archive preparation failed without logging file contents.";
    case "binary_export_download_link_generated":
      return "Short-lived archive download link was generated. Secret tokens were not stored.";
    case "binary_export_expired":
      return "Proof file binary export archive expired by metadata.";
    case "binary_export_deleted":
      return "Proof file binary export archive was deleted or revoked.";
    default:
      return "Proof file activity was recorded without file contents.";
  }
}

function presentAuditEvent(record: any) {
  return {
    eventId: String(record.eventId),
    ownerId: String(record.ownerId),
    portfolioId: String(record.portfolioId),
    fileId: String(record.fileId),
    projectId: String(record.projectId || ""),
    proofMappingId: String(record.proofMappingId || ""),
    eventType: record.eventType,
    previousStatus: String(record.previousStatus || ""),
    newStatus: String(record.newStatus || ""),
    previousVisibility: String(record.previousVisibility || ""),
    newVisibility: String(record.newVisibility || ""),
    createdAt: record.createdAt,
    actor: normalizeActor(record.actor),
    summary: safeValue(record.summary)
  };
}

async function assertPortfolioOwner(userId: string, portfolioId: string) {
  const portfolio = await findRecordById("portfolios", portfolioId);
  if (!portfolio || String(portfolio.userId) !== String(userId)) {
    throw new ApiError(404, "Portfolio not found");
  }
  return portfolio;
}

export async function recordPortfolioFileAuditEvent(input: {
  ownerId: string;
  portfolioId: string;
  fileId: string;
  projectId?: string;
  proofMappingId?: string;
  eventType: PortfolioFileAuditEventType;
  previousStatus?: string;
  newStatus?: string;
  previousVisibility?: string;
  newVisibility?: string;
  actor?: Actor;
  summary?: string;
}) {
  const eventType = normalizeEventType(input.eventType);
  if (!eventType) throw new ApiError(400, "Unsupported proof file audit event type");
  const actor = normalizeActor(input.actor);
  const record = await createRecord("portfolioFileAuditEvents", {
    eventId: randomUUID(),
    ownerId: input.ownerId,
    portfolioId: input.portfolioId,
    fileId: input.fileId,
    projectId: input.projectId ? String(input.projectId) : "",
    proofMappingId: input.proofMappingId ? String(input.proofMappingId) : "",
    eventType,
    previousStatus: safeValue(input.previousStatus),
    newStatus: safeValue(input.newStatus),
    previousVisibility: safeValue(input.previousVisibility),
    newVisibility: safeValue(input.newVisibility),
    actor,
    summary: safeValue(input.summary || defaultSummary(eventType, actor))
  });
  return presentAuditEvent(record);
}

export async function listPortfolioFileAuditEvents(userId: string, portfolioId: string, fileId: string, filters: { eventType?: any; limit?: any } = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  const eventType = normalizeEventType(filters.eventType);
  const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 100);
  const query: Record<string, any> = { ownerId: userId, portfolioId, fileId };
  if (eventType) query.eventType = eventType;
  const events = await findRecords("portfolioFileAuditEvents", query, { sort: { createdAt: -1 }, limit });
  return events.map(presentAuditEvent);
}

export async function listRecentPortfolioFileActivity(userId: string, portfolioId: string, filters: { eventType?: any; projectId?: any; limit?: any } = {}) {
  await assertPortfolioOwner(userId, portfolioId);
  const eventType = normalizeEventType(filters.eventType);
  const limit = Math.min(Math.max(Number(filters.limit) || 25, 1), 100);
  const query: Record<string, any> = { ownerId: userId, portfolioId };
  if (eventType) query.eventType = eventType;
  if (filters.projectId) query.projectId = String(filters.projectId);
  const events = await findRecords("portfolioFileAuditEvents", query, { sort: { createdAt: -1 }, limit });
  return events.map(presentAuditEvent);
}
