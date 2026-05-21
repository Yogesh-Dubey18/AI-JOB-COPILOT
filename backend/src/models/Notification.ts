import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: String,
    title: String,
    message: String,
    actionUrl: String,
    channel: { type: String, default: "in_app" },
    priority: { type: String, default: "normal" },
    scheduledFor: Date,
    deliveredAt: Date,
    deliveryStatus: { type: String, default: "pending" },
    dedupeKey: String,
    metadata: Schema.Types.Mixed,
    isRead: { type: Boolean, default: false },
    readAt: Date
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, dedupeKey: 1 });
export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;
export const NotificationModel = mongoose.models.Notification || model("Notification", NotificationSchema);
