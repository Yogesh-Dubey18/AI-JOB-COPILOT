import { parseJobFromText } from "./jobParser";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "AIJC_PARSE_JOB") return false;
  const draft = parseJobFromText(document.body?.innerText || "", document.title, window.location.href);
  sendResponse({ draft });
  return true;
});
