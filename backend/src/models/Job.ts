import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const JobSchema = new Schema(
  {
    title: { type: String, required: true, index: "text" },
    company: { type: String, required: true, index: "text" },
    location: { type: String, required: true },
    remoteType: { type: String, default: "Hybrid" },
    jobType: { type: String, default: "Full-time" },
    experienceRequired: String,
    salaryMin: Number,
    salaryMax: Number,
    currency: { type: String, default: "INR" },
    description: String,
    responsibilities: [String],
    requirements: [String],
    skillsRequired: [String],
    applyUrl: String,
    sourceUrl: String,
    companyWebsite: String,
    recruiterEmail: String,
    externalId: String,
    source: String,
    sourceType: { type: String, default: "curated" },
    normalizedTitle: String,
    normalizedCompany: String,
    duplicateKey: String,
    reviewStatus: { type: String, default: "approved" },
    riskFlags: [String],
    tags: [String],
    trustScore: { type: Number, default: 80 },
    scamRiskScore: { type: Number, default: 15 },
    postedAt: Date,
    expiresAt: Date,
    importedAt: Date,
    lastSeenAt: Date,
    lastSeenInSyncAt: Date,
    // Cached semantic embedding vector for this job's title+description+skills.
    // Computed once (lazily, on first match request) and reused thereafter to
    // avoid recomputing an embedding API call on every match. Null/absent
    // means semantic matching falls back to keyword-only scoring for this job.
    embedding: { type: [Number], default: undefined }
  },
  { timestamps: true }
);

JobSchema.index({ title: "text", company: "text", description: "text", skillsRequired: "text" });
JobSchema.index({ postedAt: -1, expiresAt: 1 });
JobSchema.index({ remoteType: 1, jobType: 1, postedAt: -1 });
JobSchema.index({ source: 1, applyUrl: 1 });
JobSchema.index({ duplicateKey: 1 }, { unique: false });
JobSchema.index({ sourceType: 1, reviewStatus: 1, postedAt: -1 });
JobSchema.index({ trustScore: -1, scamRiskScore: 1 });
export type JobDocument = InferSchemaType<typeof JobSchema>;
export const JobModel = mongoose.models.Job || model("Job", JobSchema);
