import mongoose, { Schema, model } from "mongoose";

const OAuthHandoffSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true });

export const OAuthHandoffModel = mongoose.models.OAuthHandoff || model("OAuthHandoff", OAuthHandoffSchema);
