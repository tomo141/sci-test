import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: `node node_modules/next/dist/bin/next ${process.env.SCIENCE_E2E_PRODUCTION === "1" ? "start" : "dev"} --hostname 127.0.0.1 --port 3017`,
    url: "http://127.0.0.1:3017",
    reuseExistingServer: !process.env.CI && process.env.SCIENCE_E2E_PRODUCTION !== "1",
    timeout: 90_000
  },
  use: {
    baseURL: "http://127.0.0.1:3017",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } }
  ]
});
