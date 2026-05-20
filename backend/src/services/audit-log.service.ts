type AuditEvent = {
  userId?: string;
  action: string;
  resource?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(event: AuditEvent) {
  console.info(JSON.stringify({ event: "audit_log", createdAt: new Date().toISOString(), ...event }));
  return { recorded: true, provider: "console-foundation" };
}
