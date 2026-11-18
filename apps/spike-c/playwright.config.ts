import { defineConfig } from "@playwright/test";

// Phone-shaped viewport (360 x 800, touch, device scale 3). Production build, not the dev server.
export default defineConfig({
  testDir: "test",
  timeout: 180_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5174",
    browserName: "chromium",
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    command: "npx vite build && npx vite preview",
    url: "http://localhost:5174",
    reuseExistingServer: false,
    cwd: import.meta.dirname,
    timeout: 120_000,
  },
});
