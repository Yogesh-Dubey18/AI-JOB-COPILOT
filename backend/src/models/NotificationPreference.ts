import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const NotificationPreferenceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    calendar: { type: Boolean, default: false },
    dailyDigest: { type: Boolean, default: true },
    applicationReminders: { type: Boolean, default: true },
    interviewReminders: { type: Boolean, default: true },
    quietHoursStart: String,
    quietHoursEnd: String
  },
  { timestamps: true }
);

export type NotificationPreferenceDocument = InferSchemaType<typeof NotificationPreferenceSchema>;
export const NotificationPreferenceModel = mongoose.models.NotificationPreference || model("NotificationPreference", NotificationPreferenceSchema);
