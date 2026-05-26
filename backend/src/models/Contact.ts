import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const ContactSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    company: String,
    role: String,
    email: String,
    phone: String,
    linkedinUrl: String,
    notes: String
  },
  { timestamps: true }
);

ContactSchema.index({ userId: 1, company: 1 });
export type ContactDocument = InferSchemaType<typeof ContactSchema>;
export const ContactModel = mongoose.models.Contact || model("Contact", ContactSchema);
