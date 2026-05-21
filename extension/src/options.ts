import { defaultSettings, getSettings, saveSettings } from "./storage";

const form = document.getElementById("settingsForm") as HTMLFormElement;
const apiBaseUrl = document.getElementById("apiBaseUrl") as HTMLInputElement;
const appBaseUrl = document.getElementById("appBaseUrl") as HTMLInputElement;
const status = document.getElementById("status") as HTMLParagraphElement;

function setStatus(message: string) {
  status.textContent = message;
}

getSettings().then((settings) => {
  apiBaseUrl.value = settings.apiBaseUrl || defaultSettings.apiBaseUrl;
  appBaseUrl.value = settings.appBaseUrl || defaultSettings.appBaseUrl;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveSettings({
    apiBaseUrl: apiBaseUrl.value.replace(/\/$/, "") || defaultSettings.apiBaseUrl,
    appBaseUrl: appBaseUrl.value.replace(/\/$/, "") || defaultSettings.appBaseUrl
  }).then(() => setStatus("Settings saved."));
});
