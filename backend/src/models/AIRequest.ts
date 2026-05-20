import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const AIRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    feature: { type: String, required: true, index: true },
    model: String,
    inputTokens: Number,
    outputTokens: Number,
    status: String,
    error: String
  },
  { timestamps: true }
);

export type AIRequestDocument = InferSchemaType<typeof AIRequestSchema>;
export const AIRequestModel = mongoose.models.AIRequest || model("AIRequest", AIRequestSchema);
