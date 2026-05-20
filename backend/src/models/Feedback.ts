import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const FeedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: String,
    rating: Number,
    message: String,
    page: String,
    status: { type: String, default: "open" }
  },
  { timestamps: true }
);

export type FeedbackDocument = InferSchemaType<typeof FeedbackSchema>;
export const FeedbackModel = mongoose.models.Feedback || model("Feedback", FeedbackSchema);
