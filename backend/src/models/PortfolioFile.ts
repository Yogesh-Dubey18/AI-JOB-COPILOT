import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const PortfolioFileSchema = new Schema(
  {
    fileId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    portfolioId: { type: Schema.Types.ObjectId, ref: "Portfolio", required: true, index: true },
    projectId: { type: String, default: "" },
    proofMappingId: { type: String, default: "" },
    fileType: {
      type: String,
      enum: ["resumePdf", "portfolioPdf", "screenshot", "proofFile", "other"],
      default: "other",
      index: true
    },
    storageProvider: {
      type: String,
      enum: ["local", "s3", "r2"],
      default: "local",
      index: true
    },
    storageKey: { type: String, required: true },
    originalFilename: { type: String, default: "" },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, default: 0 },
    visibility: {
      type: String,
      enum: ["private", "publicApproved"],
      default: "private",
      index: true
    },
    scanStatus: {
      type: String,
      enum: ["not_scanned", "local_validated", "provider_pending", "clean", "blocked", "failed"],
      default: "not_scanned",
      index: true
    },
    scanProvider: { type: String, default: "local-validation" },
    scannedAt: { type: Date },
    scanSummary: { type: String, default: "" },
    blockedReason: { type: String, default: "" },
    isPublicEligible: { type: Boolean, default: false, index: true },
    retentionStatus: {
      type: String,
      enum: ["active", "scheduled_for_delete", "deleted", "retained_for_audit"],
      default: "active",
      index: true
    },
    retentionReason: { type: String, default: "" },
    deleteRequestedAt: { type: Date },
    deleteCompletedAt: { type: Date },
    lastReviewedAt: { type: Date },
    reviewStatus: {
      type: String,
      enum: ["not_reviewed", "reviewed", "needs_attention"],
      default: "not_reviewed",
      index: true
    },
    ownerNote: { type: String, default: "" }
  },
  { timestamps: true }
);

PortfolioFileSchema.index({ ownerId: 1, portfolioId: 1, createdAt: -1 });
PortfolioFileSchema.index({ ownerId: 1, portfolioId: 1, retentionStatus: 1, createdAt: -1 });

export type PortfolioFileDocument = InferSchemaType<typeof PortfolioFileSchema>;
export const PortfolioFileModel = mongoose.models.PortfolioFile || model("PortfolioFile", PortfolioFileSchema);
