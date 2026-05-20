import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const InterviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
    roundType: String,
    roundNumber: Number,
    scheduledAt: Date,
    mode: String,
    interviewerName: String,
    topicsExpected: [String],
    questionsAsked: [String],
    userAnswers: [String],
    feedback: String,
    result: String,
    nextSteps: [String]
  },
  { timestamps: true }
);

export type InterviewDocument = InferSchemaType<typeof InterviewSchema>;
export const InterviewModel = mongoose.models.Interview || model("Interview", InterviewSchema);
