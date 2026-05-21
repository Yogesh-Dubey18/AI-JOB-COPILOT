import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const UsageEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    feature: { type: String, required: true, index: true },
    metric: { type: String, default: "ai_credit", index: true },
    units: { type: Number, default: 1 },
    source: { type: String, default: "api" },
    period: { type: String, index: true },
    status: { type: String, default: "recorded" },
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
);

UsageEventSchema.index({ userId: 1, period: 1, metric: 1 });

export type UsageEventDocument = InferSchemaType<typeof UsageEventSchema>;
export const UsageEventModel = mongoose.models.UsageEvent || model("UsageEvent", UsageEventSchema);
