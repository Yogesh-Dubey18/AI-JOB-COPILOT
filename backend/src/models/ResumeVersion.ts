import mongoose, { InferSchemaType, Schema, model } from "mongoose";

/**
 * ResumeVersion — represents a tailored or improved copy of a base resume.
 * sourceType tracks how this version was created:
 *   "uploaded"  — directly uploaded by user
 *   "generated" — created by AI improve/tailor flow
 *   "tailored"  — tailored for a specific job description
 *   "edited"    — manually edited by user in the builder
 */
const ResumeVersionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    baseResumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    title: { type: String, required: true },
    targetRole: String,
    targetJobId: { type: Schema.Types.ObjectId, ref: "Job" },
    /** How this version was created. */
    sourceType: {
      type: String,
      enum: ["uploaded", "generated", "tailored", "edited"],
      default: "generated"
    },
    /** ATS template label. "standard" is the default plain ATS-safe layout. */
    template: {
      type: String,
      enum: ["standard", "modern", "minimal", "compact"],
      default: "standard"
    },
    content: {
      summary: String,
      skills: [String],
      projects: [Schema.Types.Mixed],
      experience: [Schema.Types.Mixed],
      education: [Schema.Types.Mixed],
      certifications: [String]
    },
    atsScore: Number,
    pdfUrl: String,
    /** Snapshot of what changed vs the base resume (for compare view). */
    changeSummary: {
      addedSkills: [String],
      removedSkills: [String],
      summaryChanged: { type: Boolean, default: false },
      projectsChanged: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

ResumeVersionSchema.index({ userId: 1, createdAt: -1 });
ResumeVersionSchema.index({ userId: 1, baseResumeId: 1 });
export type ResumeVersionDocument = InferSchemaType<typeof ResumeVersionSchema>;
export const ResumeVersionModel = mongoose.models.ResumeVersion || model("ResumeVersion", ResumeVersionSchema);
