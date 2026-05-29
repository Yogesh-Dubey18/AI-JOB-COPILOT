import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const PortfolioFileExportRequestSchema = new Schema(
  {
    exportId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    portfolioId: { type: Schema.Types.ObjectId, ref: "Portfolio", required: true, index: true },
    status: {
      type: String,
      enum: ["requested", "preparing", "ready", "failed", "expired", "deleted"],
      default: "requested",
      index: true
    },
    requestedFileIds: { type: [String], default: [] },
    includedFileIds: { type: [String], default: [] },
    excludedFiles: {
      type: [{
        fileId: { type: String, default: "" },
        originalFilename: { type: String, default: "" },
        reason: { type: String, default: "" }
      }],
      default: []
    },
    includedFileCount: { type: Number, default: 0 },
    excludedFileCount: { type: Number, default: 0 },
    archiveStorageKey: { type: String, default: "" },
    archiveProvider: {
      type: String,
      enum: ["local", "s3", "r2"],
      default: "local"
    },
    archiveFilename: { type: String, default: "" },
    expiresAt: { type: Date },
    failureReason: { type: String, default: "" },
    safeSummary: { type: String, default: "" }
  },
  { timestamps: true }
);

PortfolioFileExportRequestSchema.index({ ownerId: 1, portfolioId: 1, createdAt: -1 });
PortfolioFileExportRequestSchema.index({ ownerId: 1, portfolioId: 1, status: 1, createdAt: -1 });
PortfolioFileExportRequestSchema.index({ status: 1, expiresAt: 1 });

export type PortfolioFileExportRequestDocument = InferSchemaType<typeof PortfolioFileExportRequestSchema>;
export const PortfolioFileExportRequestModel = mongoose.models.PortfolioFileExportRequest || model("PortfolioFileExportRequest", PortfolioFileExportRequestSchema);
