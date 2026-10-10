import { parseJobFromText } from "./jobParser";

console.log("AI Job Co-Pilot Sniffer active on job portal.");

function injectSyncButton() {
  if (document.getElementById("ai-copilot-sync-btn")) return;

  const btn = document.createElement("button");
  btn.id = "ai-copilot-sync-btn";
  btn.innerText = "🚀 Sync to AI Co-Pilot";
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.zIndex = "999999";
  btn.style.backgroundColor = "#EF6637";
  btn.style.color = "#ffffff";
  btn.style.border = "none";
  btn.style.padding = "12px 18px";
  btn.style.borderRadius = "8px";
  btn.style.fontWeight = "bold";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";

  btn.onclick = () => {
    const jobData = {
      title: document.querySelector("h1")?.innerText || document.title || "Unknown Role",
      company: (document.querySelector(".company-name") as HTMLElement)?.innerText || "Unknown Company",
      description: document.body?.innerText || "",
      url: window.location.href,
    };

    chrome.runtime.sendMessage({ type: "SYNC_JOB", payload: jobData }, (_response) => {
      alert("Job successfully synced to your AI Co-Pilot dashboard!");
    });
  };

  document.body.appendChild(btn);
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  injectSyncButton();
} else {
  window.addEventListener("load", injectSyncButton);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "AIJC_PARSE_JOB") return false;
  const draft = parseJobFromText(document.body?.innerText || "", document.title, window.location.href);
  sendResponse({ draft });
  return true;
});
