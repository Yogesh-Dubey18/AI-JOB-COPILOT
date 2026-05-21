import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const InterviewSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
    role: { type: String, default: "Full Stack Developer", index: true },
    focus: { type: String, enum: ["project", "hr", "dsa", "system-design", "mixed"], default: "mixed", index: true },
    status: { type: String, enum: ["active", "completed"], default: "active", index: true },
    questions: [String],
    currentQuestion: String,
    answers: [
      {
        question: String,
        answer: String,
        score: Schema.Types.Mixed,
        feedback: String,
        improvedAnswer: String,
        createdAt: Date
      }
    ],
    scoreHistory: [Schema.Types.Mixed],
    readinessScore: { type: Number, default: 0 },
    nextQuestion: String,
    summary: String
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ userId: 1, createdAt: -1 });
InterviewSessionSchema.index({ userId: 1, status: 1 });

export type InterviewSessionDocument = InferSchemaType<typeof InterviewSessionSchema>;
export const InterviewSessionModel = mongoose.models.InterviewSession || model("InterviewSession", InterviewSessionSchema);
