import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: String,
    title: String,
    message: String,
    actionUrl: String,
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;
export const NotificationModel = mongoose.models.Notification || model("Notification", NotificationSchema);
