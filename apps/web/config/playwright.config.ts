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
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "https://dev.habita.rent",
    ignoreHTTPSErrors: true,
    launchOptions: {
      slowMo: 500,
      args: ["--start-maximized"],
    },
    viewport: null,
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      teardown: "teardown",
    },
    {
      name: "teardown",
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /global\.(setup|teardown)\.ts/,
    },
  ],
})
