import mongoose, { InferSchemaType, Schema, model } from "mongoose";

export const applicationStatuses = [
  "Saved",
  "Applied",
  "Resume Viewed",
  "HR Call",
  "Assignment",
  "Technical Round 1",
  "Technical Round 2",
  "Managerial Round",
  "HR Round",
  "Offer",
  "Selected",
  "Rejected",
  "Withdrawn"
] as const;

const ApplicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    company: { type: String, required: true },
    role: { type: String, required: true },
    appliedDate: Date,
    applicationSource: String,
    resumeVersionId: { type: Schema.Types.ObjectId, ref: "ResumeVersion" },
    applicationKitId: { type: Schema.Types.ObjectId, ref: "ApplicationKit" },
    status: { type: String, enum: applicationStatuses, default: "Saved", index: true },
    currentRound: String,
    notes: String,
    rejectionReason: String,
    offerDetails: Schema.Types.Mixed,
    nextFollowUpDate: Date
  },
  { timestamps: true }
);

ApplicationSchema.index({ userId: 1, status: 1 });
export type ApplicationDocument = InferSchemaType<typeof ApplicationSchema>;
export const ApplicationModel = mongoose.models.Application || model("Application", ApplicationSchema);
