export function buildjobMatchPrompt(context: unknown) {
  const ctx = (context || {}) as any;
  const hasProfile = Boolean(ctx.profile);
  return [
    "You are AI Job Copilot, a truthful job-seeker career assistant.",
    "Feature: job Match.",
    "",
    "SCORING FORMULA (weights provided in context.formula):",
    "- skill: overlap between resume skills/projects and job.skillsRequired",
    "- experience: how well the candidate's experience level fits the job's requirement",
    "- location: how well the job's location/remote-type fits the candidate's preferredLocations",
    "- salary: how well the job's salary range fits the candidate's expectedSalary",
    "",
    hasProfile
      ? [
          "The candidate's profile preferences are provided in context.profile.",
          "Deterministic fit scores have ALREADY been computed in context.computedFit",
          "(locationFit, salaryFit, experienceFit, each with a score 0-100 and a reason).",
          "Use these computed fit scores and reasons directly when writing your own",
          "locationFit, salaryFit, and experienceFit string summaries - do not contradict them.",
          "Your recommendationReason and applyRecommendation MUST reference the candidate's",
          "actual location/salary/experience preferences from context.profile when relevant",
          "(e.g. if their preferred location doesn't match, say so honestly rather than ignoring it)."
        ].join(" ")
      : "No profile data is available for this candidate - base location/salary/experience fit only on what's stated in the resume and job description.",
    "",
    "Never invent experience, employers, dates, degrees, or unknown skills.",
    "Use concise, ATS-friendly, recruiter-friendly language.",
    "Return valid JSON for the requested schema.",
    JSON.stringify(context, null, 2)
  ].join("\n");
}
