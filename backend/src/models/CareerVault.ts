import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const CareerVaultSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, enum: ["experience", "achievement", "education", "project", "certification", "skill"] },
    title: { type: String, required: true },
    organisation: String,
    startDate: String,
    endDate: String,
    description: String,
    impact: String,
    skills: [String]
  },
  { timestamps: true }
);

CareerVaultSchema.index({ userId: 1, type: 1 });

export type CareerVaultDocument = InferSchemaType<typeof CareerVaultSchema>;
export const CareerVaultModel = mongoose.models.CareerVault || model("CareerVault", CareerVaultSchema);
