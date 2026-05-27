import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const PublicProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    portfolioId: { type: Schema.Types.ObjectId, ref: "Portfolio", index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: String,
    displayName: String,
    headline: String,
    hero: String,
    about: String,
    bio: String,
    skills: [String],
    projects: [Schema.Types.Mixed],
    projectCaseStudies: [Schema.Types.Mixed],
    proofMappings: [Schema.Types.Mixed],
    resumeUrl: String,
    contactEmail: String,
    contactPhone: String,
    githubUrl: String,
    linkedinUrl: String,
    links: Schema.Types.Mixed,
    theme: { type: String, enum: ["classic", "compact", "bold"], default: "classic" },
    visibility: { type: String, enum: ["private", "public"], default: "private", index: true },
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

PublicProfileSchema.index({ slug: 1, isPublished: 1 });

export type PublicProfileDocument = InferSchemaType<typeof PublicProfileSchema>;
export const PublicProfileModel = mongoose.models.PublicProfile || model("PublicProfile", PublicProfileSchema);
