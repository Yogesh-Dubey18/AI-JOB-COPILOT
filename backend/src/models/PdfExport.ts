import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const PdfExportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sourceType: {
      type: String,
      enum: ["resume", "tailored-resume", "application-kit", "portfolio", "interview-prep"],
      required: true,
      index: true
    },
    sourceId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, default: "application/pdf" },
    byteSize: Number,
    status: { type: String, enum: ["ready", "failed"], default: "ready", index: true },
    renderer: { type: String, default: "native-basic-pdf" },
    storage: { type: String, enum: ["local"], default: "local" },
    metadata: Schema.Types.Mixed,
    privacy: {
      ownerVerified: { type: Boolean, default: true },
      redactedFields: [String],
      notes: [String]
    }
  },
  { timestamps: true }
);

PdfExportSchema.index({ userId: 1, createdAt: -1 });

export type PdfExportDocument = InferSchemaType<typeof PdfExportSchema>;
export const PdfExportModel = mongoose.models.PdfExport || model("PdfExport", PdfExportSchema);
