import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const AnswerVaultSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: String,
    tags: [String]
  },
  { timestamps: true }
);

AnswerVaultSchema.index({ userId: 1, category: 1 });

export type AnswerVaultDocument = InferSchemaType<typeof AnswerVaultSchema>;
export const AnswerVaultModel = mongoose.models.AnswerVault || model("AnswerVault", AnswerVaultSchema);
