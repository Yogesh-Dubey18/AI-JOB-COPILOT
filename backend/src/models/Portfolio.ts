import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const PortfolioSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: String,
    displayName: String,
    hero: String,
    headline: String,
    about: String,
    skills: [String],
    projects: [Schema.Types.Mixed],
    projectCaseStudies: [Schema.Types.Mixed],
    proofMappings: [Schema.Types.Mixed],
    versionHistory: [Schema.Types.Mixed],
    resumeUrl: String,
    contactEmail: String,
    contactPhone: String,
    githubUrl: String,
    linkedinUrl: String,
    theme: { type: String, enum: ["classic", "compact", "bold"], default: "classic" },
    sections: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      showResume: { type: Boolean, default: false },
      showProjects: { type: Boolean, default: true },
      showSkills: { type: Boolean, default: true },
      showLinks: { type: Boolean, default: true },
      showRoadmap: { type: Boolean, default: false },
      showCaseStudies: { type: Boolean, default: true },
      showProofMappings: { type: Boolean, default: false }
    },
    isPublished: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export type PortfolioDocument = InferSchemaType<typeof PortfolioSchema>;
export const PortfolioModel = mongoose.models.Portfolio || model("Portfolio", PortfolioSchema);
