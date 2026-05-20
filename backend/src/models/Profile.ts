import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const EducationSchema = new Schema(
  {
    degree: String,
    college: String,
    graduationYear: Number
  },
  { _id: false }
);

const ProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    headline: String,
    education: [EducationSchema],
    currentRole: String,
    targetRoles: [String],
    experienceLevel: { type: String, enum: ["fresher", "junior", "mid", "senior"], default: "fresher" },
    totalExperienceYears: { type: Number, default: 0 },
    skills: [String],
    softSkills: [String],
    preferredLocations: [String],
    preferredJobTypes: [String],
    expectedSalary: Number,
    noticePeriod: String,
    githubUrl: String,
    linkedinUrl: String,
    portfolioUrl: String,
    profileCompletenessScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export type ProfileDocument = InferSchemaType<typeof ProfileSchema>;
export const ProfileModel = mongoose.models.Profile || model("Profile", ProfileSchema);
