import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const JobMatchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume" },
    matchScore: Number,
    selectionChance: String,
    matchedSkills: [String],
    missingSkills: [String],
    experienceFit: String,
    salaryFit: String,
    locationFit: String,
    recommendationReason: String,
    applyRecommendation: String,
    riskFlags: [String]
  },
  { timestamps: true }
);

JobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: false });
export type JobMatchDocument = InferSchemaType<typeof JobMatchSchema>;
export const JobMatchModel = mongoose.models.JobMatch || model("JobMatch", JobMatchSchema);
