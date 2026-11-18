import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "packages/engine/test-browser",
  timeout: 300_000,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173", browserName: "chromium" },
  webServer: {
    command: "npx vite --config packages/engine/browser/vite.config.ts",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
});
