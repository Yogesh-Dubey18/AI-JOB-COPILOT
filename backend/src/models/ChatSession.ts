import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    role: { type: String, required: true },
    content: { type: String, required: true, default: "I'm here to help. Please try again." },
    metadata: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ChatSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: String,
    messages: [ChatMessageSchema]
  },
  { timestamps: true }
);

export type ChatSessionDocument = InferSchemaType<typeof ChatSessionSchema>;
export const ChatSessionModel = mongoose.models.ChatSession || model("ChatSession", ChatSessionSchema);
