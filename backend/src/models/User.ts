import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    avatarUrl: String,
    role: { type: String, enum: ["job_seeker", "admin"], default: "job_seeker", index: true },
    isEmailVerified: { type: Boolean, default: false },
    googleId: { type: String, sparse: true, index: true },
    refreshTokenHash: String,
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    passwordChangedAt: Date,
    lastLoginAt: Date
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, createdAt: -1 });
export type UserDocument = InferSchemaType<typeof UserSchema>;
export const UserModel = mongoose.models.User || model("User", UserSchema);
