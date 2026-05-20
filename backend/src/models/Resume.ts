import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const ResumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    rawText: { type: String, default: "" },
    parsedData: {
      name: String,
      email: String,
      phone: String,
      summary: String,
      skills: [String],
      experience: [Schema.Types.Mixed],
      projects: [Schema.Types.Mixed],
      education: [Schema.Types.Mixed],
      certifications: [String],
      links: [String]
    },
    isBaseResume: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ResumeSchema.index({ userId: 1, isBaseResume: 1 });
ResumeSchema.index({ userId: 1, createdAt: -1 });
ResumeSchema.index({ userId: 1, fileName: 1 });
export type ResumeDocument = InferSchemaType<typeof ResumeSchema>;
export const ResumeModel = mongoose.models.Resume || model("Resume", ResumeSchema);
