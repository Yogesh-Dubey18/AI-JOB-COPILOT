import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: String,
    action: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    method: String,
    path: String,
    statusCode: Number,
    ip: String,
    userAgent: String,
    riskLevel: { type: String, default: "low", index: true },
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof AuditLogSchema>;
export const AuditLogModel = mongoose.models.AuditLog || model("AuditLog", AuditLogSchema);
