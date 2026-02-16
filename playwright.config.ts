import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * Run tests with:
 *   bun run test:e2e          - Run all tests headless
 *   bun run test:e2e:ui       - Run with interactive UI
 *   bun run test:e2e:debug    - Run in debug mode
 *   bun run test:e2e:headed   - Run with visible browser
 */

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: 0,
  workers: 1,
  reporter: [
    ["html", { outputFolder: "e2e/playwright-report", open: "never" }],
    ["json", { outputFile: "e2e/test-results.json" }],
    ["list"],
  ],
  outputDir: "e2e/test-results",

  use: {
    baseURL: process.env.BASE_URL || process.env.VITE_BASE_URL || "http://localhost:8000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // In CI/Docker, servers are already running externally
  ...(isCI
    ? {}
    : {
        webServer: [
          {
            command: "cd ../milkly-backend && bun run dev",
            url: "http://localhost:3000/api/health",
            reuseExistingServer: true,
            timeout: 120000,
          },
          {
            command: "bun run dev",
            url: "http://localhost:8000",
            reuseExistingServer: true,
            timeout: 120000,
          },
        ],
      }),
});
