import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const JobSyncRunSchema = new Schema(
  {
    source: { type: String, required: true, index: true },
    status: { type: String, enum: ["completed", "failed", "skipped"], required: true, index: true },
    triggeredBy: { type: String, enum: ["cron", "startup", "admin"], default: "cron" },
    startedAt: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    durationMs: { type: Number, default: 0 },
    importedCount: { type: Number, default: 0 },
    message: { type: String, default: "" },
    error: { type: String, default: "" }
  },
  { timestamps: true }
);

JobSyncRunSchema.index({ source: 1, startedAt: -1 });
// Run history is operational noise after a while; MongoDB drops old rows by itself.
JobSyncRunSchema.index({ startedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export type JobSyncRunDocument = InferSchemaType<typeof JobSyncRunSchema>;
export const JobSyncRunModel = mongoose.models.JobSyncRun || model("JobSyncRun", JobSyncRunSchema);
