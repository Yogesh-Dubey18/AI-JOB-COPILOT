import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const MaintenanceRunSchema = new Schema(
  {
    runId: { type: String, required: true, unique: true, index: true },
    jobType: {
      type: String,
      enum: ["proof_archive_cleanup"],
      required: true,
      index: true
    },
    triggeredBy: {
      type: String,
      enum: ["admin", "system", "manual"],
      default: "manual",
      index: true
    },
    status: {
      type: String,
      enum: ["started", "completed", "failed", "partial"],
      default: "started",
      index: true
    },
    startedAt: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    durationMs: { type: Number, default: 0 },
    scannedCount: { type: Number, default: 0 },
    expiredCount: { type: Number, default: 0 },
    deletedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    safeSummary: { type: String, default: "" },
    failureReason: { type: String, default: "" }
  },
  { timestamps: true }
);

MaintenanceRunSchema.index({ jobType: 1, startedAt: -1 });
MaintenanceRunSchema.index({ status: 1, startedAt: -1 });

export type MaintenanceRunDocument = InferSchemaType<typeof MaintenanceRunSchema>;
export const MaintenanceRunModel = mongoose.models.MaintenanceRun || model("MaintenanceRun", MaintenanceRunSchema);
