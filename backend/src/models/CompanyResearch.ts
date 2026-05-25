import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const CompanyResearchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyName: { type: String, required: true },
    industry: String,
    techStack: [String],
    culture: String,
    glassdoorRating: Number,
    salaryRangeMin: Number,
    salaryRangeMax: Number,
    careerPageUrl: String,
    interviewProcess: String,
    notes: String
  },
  { timestamps: true }
);

CompanyResearchSchema.index({ userId: 1, companyName: 1 });

export type CompanyResearchDocument = InferSchemaType<typeof CompanyResearchSchema>;
export const CompanyResearchModel = mongoose.models.CompanyResearch || model("CompanyResearch", CompanyResearchSchema);
