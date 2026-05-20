import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const TailoredResumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    baseResumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    resumeVersionId: { type: Schema.Types.ObjectId, ref: "ResumeVersion" },
    beforeAtsScore: Number,
    afterAtsScore: Number,
    addedKeywords: [String],
    updatedSummary: String,
    updatedSkills: [String],
    improvedProjects: [Schema.Types.Mixed],
    changedSections: [String],
    pdfUrl: String
  },
  { timestamps: true }
);

export type TailoredResumeDocument = InferSchemaType<typeof TailoredResumeSchema>;
export const TailoredResumeModel = mongoose.models.TailoredResume || model("TailoredResume", TailoredResumeSchema);
