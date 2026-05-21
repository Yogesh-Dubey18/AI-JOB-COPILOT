import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const FeedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: ["bug", "feature", "ux", "content", "performance", "security", "other"], default: "other", index: true },
    rating: { type: Number, min: 1, max: 5 },
    message: { type: String, required: true, trim: true },
    page: String,
    source: { type: String, default: "in_app" },
    contactEmail: String,
    status: { type: String, enum: ["open", "in_review", "planned", "in_progress", "resolved", "closed"], default: "open", index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
    issueTitle: String,
    issueLabels: [String],
    issueDraft: String,
    issueUrl: String,
    releaseTarget: String,
    adminNotes: String
  },
  { timestamps: true }
);

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ status: 1, priority: 1, createdAt: -1 });

export type FeedbackDocument = InferSchemaType<typeof FeedbackSchema>;
export const FeedbackModel = mongoose.models.Feedback || model("Feedback", FeedbackSchema);
