import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const MockInterviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: String,
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
    currentQuestion: String,
    transcript: [Schema.Types.Mixed],
    score: Schema.Types.Mixed,
    feedback: String,
    status: { type: String, default: "active" }
  },
  { timestamps: true }
);

export type MockInterviewDocument = InferSchemaType<typeof MockInterviewSchema>;
export const MockInterviewModel = mongoose.models.MockInterview || model("MockInterview", MockInterviewSchema);
