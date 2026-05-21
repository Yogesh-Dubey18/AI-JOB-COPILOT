import { JobDraft } from "./types";

export function interestMessage(draft: JobDraft) {
  return [
    `Hi, I found the ${draft.title} role at ${draft.company} and I am interested in applying.`,
    "My background aligns with the listed skills, and I will apply through the official job link after reviewing the requirements.",
    "Please let me know if there is any additional information I should include."
  ].join(" ");
}
