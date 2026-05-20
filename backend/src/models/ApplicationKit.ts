import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const ApplicationKitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    resumeVersionId: { type: Schema.Types.ObjectId, ref: "ResumeVersion" },
    coverLetter: String,
    hrEmail: String,
    linkedinMessage: String,
    whatsappMessage: String,
    referralMessage: String,
    salaryAnswer: String,
    whyHireYouAnswer: String,
    tellMeAboutYourselfAnswer: String,
    interviewPrepPlan: [String]
  },
  { timestamps: true }
);

export type ApplicationKitDocument = InferSchemaType<typeof ApplicationKitSchema>;
export const ApplicationKitModel = mongoose.models.ApplicationKit || model("ApplicationKit", ApplicationKitSchema);
