import { defineConfig } from "@playwright/test"

// Load env vars when running outside Docker (inside Docker, env_file handles this)
if (!process.env.POSTGRES_USER) {
  const { config } = await import("dotenv")
  config({
    path: new URL("../../infra/.env.dev", import.meta.url)
      .pathname,
  })
}

export default defineConfig({
  testDir: ".",
  forbidOnly: !!process.env.CI,
  workers: 1,
  reporter: "list",
  timeout: 5000,
  expect: { timeout: 5000 },
  use: {
    baseURL: "https://dev.habita.rent",
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: ["--start-maximized"],
    },
    viewport: null,
  },
  projects: [
    {
      name: "setup",
      testMatch: "test/e2e/global.setup.ts",
      teardown: "teardown",
    },
    {
      name: "teardown",
      testMatch: "test/e2e/global.teardown.ts",
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testMatch: [
        "test/e2e/cases/**/*.test.ts",
        "src/**/e2e/**/*.test.ts",
      ],
    },
  ],
})
