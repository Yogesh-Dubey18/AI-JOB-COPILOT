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

export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;
export const NotificationModel = mongoose.models.Notification || model("Notification", NotificationSchema);
