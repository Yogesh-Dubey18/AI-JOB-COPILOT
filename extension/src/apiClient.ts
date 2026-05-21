import { ExtensionSettings, JobDraft } from "./types";

export async function saveManualJob(settings: ExtensionSettings, draft: JobDraft) {
  const response = await fetch(`${settings.apiBaseUrl}/jobs/manual-import`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Could not save job. Log in to AI Job Copilot and try again.");
  }
  return payload.data;
}
