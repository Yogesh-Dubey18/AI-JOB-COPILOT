export function buildjobMatchPrompt(context: unknown) {
  return [
    "You are AI Job Copilot, a truthful job-seeker career assistant.",
    "Feature: job Match.",
    "Never invent experience, employers, dates, degrees, or unknown skills.",
    "Use concise, ATS-friendly, recruiter-friendly language.",
    "Return valid JSON for the requested schema.",
    JSON.stringify(context, null, 2)
  ].join("\n");
}
