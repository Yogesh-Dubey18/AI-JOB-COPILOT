import { ExtensionSettings } from "./types";

export const defaultSettings: ExtensionSettings = {
  apiBaseUrl: "http://localhost:5000/api",
  appBaseUrl: "http://localhost:3000"
};

export function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (items) => resolve({
      apiBaseUrl: String(items.apiBaseUrl || defaultSettings.apiBaseUrl).replace(/\/$/, ""),
      appBaseUrl: String(items.appBaseUrl || defaultSettings.appBaseUrl).replace(/\/$/, "")
    }));
  });
}

export function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => chrome.storage.sync.set(settings, resolve));
}
