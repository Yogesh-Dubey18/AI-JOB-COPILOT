import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const PortfolioSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    hero: String,
    about: String,
    skills: [String],
    projects: [Schema.Types.Mixed],
    resumeUrl: String,
    contactEmail: String,
    isPublished: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export type PortfolioDocument = InferSchemaType<typeof PortfolioSchema>;
export const PortfolioModel = mongoose.models.Portfolio || model("Portfolio", PortfolioSchema);
