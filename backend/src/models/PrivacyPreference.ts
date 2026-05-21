import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const PrivacyPreferenceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    allowAiTraining: { type: Boolean, default: false },
    shareProductAnalytics: { type: Boolean, default: false },
    emailDataExportUpdates: { type: Boolean, default: true },
    personalizationEnabled: { type: Boolean, default: true },
    deleteRequestedAt: Date
  },
  { timestamps: true }
);

export type PrivacyPreferenceDocument = InferSchemaType<typeof PrivacyPreferenceSchema>;
export const PrivacyPreferenceModel = mongoose.models.PrivacyPreference || model("PrivacyPreference", PrivacyPreferenceSchema);
