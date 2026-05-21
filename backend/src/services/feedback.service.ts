import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";

type FeedbackInput = {
  type?: string;
  rating?: number;
  message: string;
  page?: string;
  source?: string;
  contactEmail?: string;
};

type FeedbackUpdateInput = {
  status?: string;
  priority?: string;
  releaseTarget?: string;
  adminNotes?: string;
  issueUrl?: string;
};

const typeLabels: Record<string, string[]> = {
  bug: ["bug", "needs-triage"],
  feature: ["enhancement", "product-feedback"],
  ux: ["ux", "product-feedback"],
  content: ["content", "documentation"],
  performance: ["performance", "needs-triage"],
  security: ["security", "needs-review"],
  other: ["feedback", "needs-triage"]
};

function inferSentiment(rating?: number) {
  if (!rating) return "neutral";
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

function inferPriority(input: FeedbackInput) {
  const message = input.message.toLowerCase();
  if (input.type === "security" || /security|privacy|leak|token|password|crash|blocked|data loss/.test(message)) return "high";
  if (input.type === "bug" || input.type === "performance" || (input.rating || 5) <= 2) return "medium";
  return "low";
}

function summarize(items: any[]) {
  const open = items.filter((item) => item.status === "open" || item.status === "in_review").length;
  const highPriority = items.filter((item) => item.priority === "high").length;
  const averageRating = items.filter((item) => item.rating).reduce((sum, item) => sum + Number(item.rating), 0) / Math.max(items.filter((item) => item.rating).length, 1);
  const byType = items.reduce((acc: Record<string, number>, item) => {
    acc[item.type || "other"] = (acc[item.type || "other"] || 0) + 1;
    return acc;
  }, {});
  return {
    total: items.length,
    open,
    highPriority,
    averageRating: Math.round(averageRating * 10) / 10,
    byType
  };
}

export function buildIssueDraft(feedback: any) {
  const title = `[${String(feedback.type || "feedback").toUpperCase()}] ${String(feedback.message || "Feedback").slice(0, 72)}`;
  const labels = typeLabels[feedback.type || "other"] || typeLabels.other;
  const body = [
    "## User Feedback",
    "",
    feedback.message,
    "",
    "## Context",
    "",
    `- Type: ${feedback.type || "other"}`,
    `- Priority: ${feedback.priority || "medium"}`,
    `- Rating: ${feedback.rating || "not provided"}`,
    `- Page: ${feedback.page || "not provided"}`,
    `- Source: ${feedback.source || "in_app"}`,
    "",
    "## Triage Checklist",
    "",
    "- [ ] Reproduce or validate the feedback.",
    "- [ ] Decide whether this becomes a bug, feature, documentation update, or backlog item.",
    "- [ ] Add acceptance criteria.",
    "- [ ] Link the release or sprint target.",
    "",
    "Note: This is a draft only. It does not create a GitHub issue automatically."
  ].join("\n");
  return { title, labels, body };
}

export async function createFeedback(user: { id: string; email: string }, input: FeedbackInput) {
  const record = await createRecord("feedback", {
    userId: user.id,
    type: input.type || "other",
    rating: input.rating,
    message: input.message,
    page: input.page,
    source: input.source || "in_app",
    contactEmail: input.contactEmail || user.email,
    status: "open",
    priority: inferPriority(input),
    sentiment: inferSentiment(input.rating)
  });
  const draft = buildIssueDraft(record);
  return updateRecord("feedback", String(record._id), { issueTitle: draft.title, issueLabels: draft.labels, issueDraft: draft.body });
}

export async function listMyFeedback(userId: string) {
  const items = await findRecords("feedback", { userId }, { sort: { createdAt: -1 }, limit: 50 });
  return { items, summary: summarize(items) };
}

export async function listFeedbackInbox() {
  const items = await findRecords("feedback", {}, { sort: { createdAt: -1 }, limit: 200 });
  return {
    items,
    summary: summarize(items),
    issueQueue: items.filter((item) => item.status !== "closed" && item.status !== "resolved").slice(0, 20).map((item) => ({
      id: item._id,
      title: item.issueTitle || buildIssueDraft(item).title,
      labels: item.issueLabels || buildIssueDraft(item).labels,
      priority: item.priority,
      status: item.status
    }))
  };
}

export async function updateFeedbackTriage(id: string, input: FeedbackUpdateInput) {
  const existing = await findRecordById("feedback", id);
  if (!existing) throw new ApiError(404, "Feedback not found");
  const update = {
    ...input,
    issueUrl: input.issueUrl || undefined
  };
  return updateRecord("feedback", id, update);
}

export async function createFeedbackIssueDraft(id: string) {
  const existing = await findRecordById("feedback", id);
  if (!existing) throw new ApiError(404, "Feedback not found");
  const draft = buildIssueDraft(existing);
  await updateRecord("feedback", id, { issueTitle: draft.title, issueLabels: draft.labels, issueDraft: draft.body });
  return draft;
}
