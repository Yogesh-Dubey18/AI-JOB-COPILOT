import { saveManualJob } from "./apiClient";
import { draftFromForm } from "./jobParser";
import { interestMessage } from "./messageTemplates";
import { getSettings } from "./storage";
import { JobDraft } from "./types";

const status = document.getElementById("status") as HTMLParagraphElement;
const form = document.getElementById("jobForm") as HTMLFormElement;
const fields = {
  title: document.getElementById("title") as HTMLInputElement,
  company: document.getElementById("company") as HTMLInputElement,
  location: document.getElementById("location") as HTMLInputElement,
  applyUrl: document.getElementById("applyUrl") as HTMLInputElement,
  skillsRequired: document.getElementById("skillsRequired") as HTMLInputElement,
  description: document.getElementById("description") as HTMLTextAreaElement
};

let currentDraft: JobDraft | null = null;

function setStatus(message: string) {
  status.textContent = message;
}

function fillForm(draft: JobDraft) {
  currentDraft = draft;
  fields.title.value = draft.title;
  fields.company.value = draft.company;
  fields.location.value = draft.location;
  fields.applyUrl.value = draft.applyUrl;
  fields.skillsRequired.value = draft.skillsRequired.join(", ");
  fields.description.value = draft.description;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found.");
  return tab;
}

async function parseVisibleJob() {
  setStatus("Parsing visible page...");
  const tab = await activeTab();
  const response = await chrome.tabs.sendMessage(tab.id!, { type: "AIJC_PARSE_JOB" });
  if (!response?.draft) throw new Error("Could not parse this page. Refresh the tab and try again.");
  fillForm(response.draft);
  setStatus("Draft ready. Review fields before saving.");
}

async function saveReviewedJob() {
  const settings = await getSettings();
  const draft = draftFromForm(form);
  setStatus("Saving reviewed job...");
  const saved = await saveManualJob(settings, draft);
  setStatus(saved.duplicate ? "Job already exists in AI Job Copilot." : "Job saved for review in AI Job Copilot.");
}

async function copyMessage() {
  const draft = currentDraft || draftFromForm(form);
  await navigator.clipboard.writeText(interestMessage(draft));
  setStatus("Message copied. Review before sending.");
}

async function openApp() {
  const settings = await getSettings();
  chrome.tabs.create({ url: `${settings.appBaseUrl}/jobs` });
}

document.getElementById("parsePage")?.addEventListener("click", () => parseVisibleJob().catch((error) => setStatus(error.message)));
document.getElementById("saveJob")?.addEventListener("click", () => saveReviewedJob().catch((error) => setStatus(error.message)));
document.getElementById("copyMessage")?.addEventListener("click", () => copyMessage().catch((error) => setStatus(error.message)));
document.getElementById("openApp")?.addEventListener("click", () => openApp().catch((error) => setStatus(error.message)));
