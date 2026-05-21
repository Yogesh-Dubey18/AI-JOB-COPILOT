import { createRecord, findRecords } from "../utils/repository.js";

type AuditEvent = {
  actorUserId?: string;
  actorRole?: string;
  action: string;
  category: string;
  method?: string;
  path?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  riskLevel?: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(event: AuditEvent) {
  const payload = {
    ...event,
    riskLevel: event.riskLevel || "low"
  };
  console.info(JSON.stringify({ event: "audit_log", createdAt: new Date().toISOString(), ...payload }));
  return createRecord("auditLogs", payload);
}

export async function listAuditLogs(limit = 100) {
  return findRecords("auditLogs", {}, { sort: { createdAt: -1 }, limit });
}
