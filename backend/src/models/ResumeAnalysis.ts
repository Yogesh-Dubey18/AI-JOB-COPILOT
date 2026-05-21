import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const ResumeAnalysisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    targetRole: String,
    atsScore: Number,
    resumeLevel: String,
    sectionScores: {
      summary: Number,
      skills: Number,
      projects: Number,
      experience: Number,
      education: Number,
      formatting: Number
    },
    strengths: [String],
    weaknesses: [String],
    missingKeywords: [String],
    improvementSuggestions: [String],
    recruiterView: String,
    roleKeywordBank: {
      name: String,
      keywords: [String]
    },
    keywordCoverage: {
      targetRole: String,
      detectedKeywords: [String],
      missingKeywords: [String],
      coveragePercent: Number
    },
    atsBreakdown: {
      contactInformation: Number,
      skillsMatch: Number,
      experienceProjectQuality: Number,
      keywords: Number,
      formatting: Number,
      actionVerbs: Number,
      total: Number
    },
    jobDescriptionCoverage: {
      detectedKeywords: [String],
      missingKeywords: [String],
      coveragePercent: Number,
      keywordCount: Number,
      suggestions: [String]
    },
    privacyMode: String,
    redactedFields: [String],
    parserWarnings: [String]
  },
  { timestamps: true }
);

export type ResumeAnalysisDocument = InferSchemaType<typeof ResumeAnalysisSchema>;
export const ResumeAnalysisModel = mongoose.models.ResumeAnalysis || model("ResumeAnalysis", ResumeAnalysisSchema);
