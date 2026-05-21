import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const AIRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    feature: { type: String, required: true, index: true },
    model: String,
    provider: { type: String, index: true },
    inputTokens: Number,
    outputTokens: Number,
    status: { type: String, index: true },
    error: String,
    latencyMs: Number,
    fallbackUsed: { type: Boolean, default: false },
    validationPassed: { type: Boolean, default: true },
    safetyFlags: [String],
    promptChars: Number
  },
  { timestamps: true }
);

AIRequestSchema.index({ userId: 1, createdAt: -1 });
AIRequestSchema.index({ feature: 1, createdAt: -1 });

export type AIRequestDocument = InferSchemaType<typeof AIRequestSchema>;
export const AIRequestModel = mongoose.models.AIRequest || model("AIRequest", AIRequestSchema);
