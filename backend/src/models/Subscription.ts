import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: String, required: true, index: true },
    status: { type: String, default: "active", index: true },
    provider: { type: String, default: "mock" },
    providerCustomerId: String,
    providerSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });

export type SubscriptionDocument = InferSchemaType<typeof SubscriptionSchema>;
export const SubscriptionModel = mongoose.models.Subscription || model("Subscription", SubscriptionSchema);
