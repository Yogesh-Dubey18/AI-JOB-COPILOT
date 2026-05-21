/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium" },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true } }
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
};
