const terminalStatuses = new Set(["Rejected", "Withdrawn"]);
const interviewStatuses = new Set(["Interview Scheduled", "Technical Round", "HR Round", "Offer"]);

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function deriveRound(status: string) {
  if (status === "Interview Scheduled") return { currentRound: "Interview Scheduled", roundNumber: 1 };
  if (status === "Technical Round") return { currentRound: "Technical Round", roundNumber: 2 };
  if (status === "HR Round") return { currentRound: "HR Round", roundNumber: 3 };
  if (status === "Offer") return { currentRound: "Offer", roundNumber: 4 };
  return { currentRound: "", roundNumber: 0 };
}

export function defaultFollowUpDate(status: string, now = new Date()) {
  if (terminalStatuses.has(status)) return undefined;
  if (status === "Saved") return addDays(now, 7);
  if (status === "Applied") return addDays(now, 5);
  if (status === "Interview Scheduled") return addDays(now, 2);
  if (status === "Technical Round") return addDays(now, 2);
  if (status === "HR Round") return addDays(now, 2);
  if (status === "Offer") return addDays(now, 1);
  return addDays(now, 5);
}

export function followUpStatus(nextFollowUpDate: unknown, status: string, now = new Date()) {
  if (terminalStatuses.has(status)) return "closed";
  if (!nextFollowUpDate) return "not_scheduled";
  const due = new Date(String(nextFollowUpDate));
  if (Number.isNaN(due.getTime())) return "not_scheduled";
  if (due.getTime() < now.getTime()) return "overdue";
  if (due.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) return "due_soon";
  return "scheduled";
}

export function buildTimelineEvent(type: string, title: string, message: string, metadata: Record<string, any> = {}) {
  return { type, title, message, metadata, createdAt: new Date() };
}

export function enrichApplicationForStage(input: any, previous: any = {}) {
  const status = input.status || previous.status || "Saved";
  const round = deriveRound(status);
  const nextFollowUpDate = input.nextFollowUpDate || (status !== previous.status ? defaultFollowUpDate(status) : previous.nextFollowUpDate) || defaultFollowUpDate(status);
  const timeline = [...(input.timeline || previous.timeline || [])];
  if (!previous._id) timeline.push(buildTimelineEvent("created", "Application created", `Started tracking ${input.role || previous.role || "role"} at ${input.company || previous.company || "company"}.`, { status }));
  if (previous._id && status !== previous.status) timeline.push(buildTimelineEvent("status_changed", "Status updated", `Moved from ${previous.status} to ${status}.`, { from: previous.status, to: status }));
  if (input.notes && input.notes !== previous.notes) timeline.push(buildTimelineEvent("note_added", "Notes updated", "Application notes were updated."));
  const priorityScore = calculatePriorityScore({ ...previous, ...input, status, nextFollowUpDate });
  return {
    ...input,
    status,
    currentRound: input.currentRound || round.currentRound || previous.currentRound,
    roundNumber: input.roundNumber ?? round.roundNumber ?? previous.roundNumber,
    interviewStage: interviewStatuses.has(status) ? status : previous.interviewStage,
    nextFollowUpDate,
    followUpStatus: followUpStatus(nextFollowUpDate, status),
    priorityScore,
    lastActivityAt: new Date(),
    timeline
  };
}

export function calculatePriorityScore(app: any) {
  if (terminalStatuses.has(app.status)) return 0;
  let score = 20;
  if (app.status === "Applied") score += 20;
  if (interviewStatuses.has(app.status)) score += 35;
  if (app.status === "Offer") score += 45;
  if (followUpStatus(app.nextFollowUpDate, app.status) === "overdue") score += 25;
  if (followUpStatus(app.nextFollowUpDate, app.status) === "due_soon") score += 15;
  return Math.min(100, score);
}

export function summarizeApplications(applications: any[]) {
  const active = applications.filter((app) => !terminalStatuses.has(app.status));
  const followUpsDue = active.filter((app) => ["overdue", "due_soon"].includes(followUpStatus(app.nextFollowUpDate, app.status)));
  const interviews = applications.filter((app) => interviewStatuses.has(app.status));
  const offers = applications.filter((app) => ["Offer", "Selected"].includes(app.status));
  const rejected = applications.filter((app) => app.status === "Rejected");
  const applied = applications.filter((app) => app.status !== "Saved");
  return {
    total: applications.length,
    active: active.length,
    followUpsDue: followUpsDue.length,
    interviews: interviews.length,
    offers: offers.length,
    rejected: rejected.length,
    responseRate: applied.length ? Math.round((interviews.length / applied.length) * 100) : 0,
    nextActions: followUpsDue.slice(0, 5).map((app) => ({
      applicationId: app._id,
      company: app.company,
      role: app.role,
      status: app.status,
      nextFollowUpDate: app.nextFollowUpDate,
      priorityScore: calculatePriorityScore(app)
    })).sort((a, b) => b.priorityScore - a.priorityScore)
  };
}
