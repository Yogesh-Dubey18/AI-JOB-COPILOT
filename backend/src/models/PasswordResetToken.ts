import mongoose, { Schema, model } from "mongoose";

const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // TTL index: expires in 1 hour
  }
);

export const PasswordResetTokenModel = mongoose.models.PasswordResetToken || model("PasswordResetToken", PasswordResetTokenSchema);
