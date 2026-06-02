import mongoose, { Schema, model } from "mongoose";

const EmailVerificationTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL index: expires in 24 hours
  }
);

export const EmailVerificationTokenModel = mongoose.models.EmailVerificationToken || model("EmailVerificationToken", EmailVerificationTokenSchema);
