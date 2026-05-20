import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const JobScamReportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    trustScore: Number,
    riskLevel: String,
    redFlags: [String],
    recommendation: String
  },
  { timestamps: true }
);

export type JobScamReportDocument = InferSchemaType<typeof JobScamReportSchema>;
export const JobScamReportModel = mongoose.models.JobScamReport || model("JobScamReport", JobScamReportSchema);
