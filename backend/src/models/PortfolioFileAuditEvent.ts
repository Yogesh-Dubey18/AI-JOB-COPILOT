import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const PortfolioFileAuditEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    portfolioId: { type: Schema.Types.ObjectId, ref: "Portfolio", required: true, index: true },
    fileId: { type: String, required: true, index: true },
    projectId: { type: String, default: "", index: true },
    proofMappingId: { type: String, default: "" },
    eventType: {
      type: String,
      enum: [
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
      ],
      required: true,
      index: true
    },
    previousStatus: { type: String, default: "" },
    newStatus: { type: String, default: "" },
    previousVisibility: { type: String, default: "" },
    newVisibility: { type: String, default: "" },
    actor: { type: String, enum: ["user", "system"], default: "user", index: true },
    summary: { type: String, default: "" }
  },
  { timestamps: true }
);

PortfolioFileAuditEventSchema.index({ ownerId: 1, portfolioId: 1, createdAt: -1 });
PortfolioFileAuditEventSchema.index({ ownerId: 1, portfolioId: 1, fileId: 1, createdAt: -1 });
PortfolioFileAuditEventSchema.index({ ownerId: 1, portfolioId: 1, eventType: 1, createdAt: -1 });

export type PortfolioFileAuditEventDocument = InferSchemaType<typeof PortfolioFileAuditEventSchema>;
export const PortfolioFileAuditEventModel = mongoose.models.PortfolioFileAuditEvent || model("PortfolioFileAuditEvent", PortfolioFileAuditEventSchema);
