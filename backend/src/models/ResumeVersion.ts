import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const ResumeVersionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    baseResumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    title: { type: String, required: true },
    targetRole: String,
    targetJobId: { type: Schema.Types.ObjectId, ref: "Job" },
    content: {
      summary: String,
      skills: [String],
      projects: [Schema.Types.Mixed],
      experience: [Schema.Types.Mixed],
      education: [Schema.Types.Mixed],
      certifications: [String]
    },
    atsScore: Number,
    pdfUrl: String
  },
  { timestamps: true }
);

export type ResumeVersionDocument = InferSchemaType<typeof ResumeVersionSchema>;
export const ResumeVersionModel = mongoose.models.ResumeVersion || model("ResumeVersion", ResumeVersionSchema);
