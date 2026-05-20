import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const AnalyticsSnapshotSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    totalSavedJobs: Number,
    totalApplied: Number,
    totalShortlisted: Number,
    totalInterviews: Number,
    totalRejected: Number,
    totalOffers: Number,
    responseRate: Number,
    interviewRate: Number,
    offerRate: Number,
    averageAtsScore: Number,
    resumeScoreTrend: [Schema.Types.Mixed],
    bestJobSources: [Schema.Types.Mixed],
    mostMissingSkills: [Schema.Types.Mixed],
    weeklyApplicationChart: [Schema.Types.Mixed],
    applicationStatusChart: [Schema.Types.Mixed]
  },
  { timestamps: true }
);

export type AnalyticsSnapshotDocument = InferSchemaType<typeof AnalyticsSnapshotSchema>;
export const AnalyticsSnapshotModel = mongoose.models.AnalyticsSnapshot || model("AnalyticsSnapshot", AnalyticsSnapshotSchema);
