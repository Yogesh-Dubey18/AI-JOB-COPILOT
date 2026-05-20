import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const LearningPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetRole: String,
    missingSkills: [String],
    prioritySkills: [String],
    sevenDayPlan: [String],
    thirtyDayPlan: [String],
    projectSuggestions: [String],
    progress: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export type LearningPlanDocument = InferSchemaType<typeof LearningPlanSchema>;
export const LearningPlanModel = mongoose.models.LearningPlan || model("LearningPlan", LearningPlanSchema);
