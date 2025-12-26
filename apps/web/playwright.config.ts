import { defineConfig } from "@playwright/test"

// Load env vars when running outside Docker (inside Docker, env_file handles this)
if (!process.env.POSTGRES_USER) {
  const { config } = await import("dotenv")
  config({
    path: new URL(
      "../../infra/development/.env",
      import.meta.url,
    ).pathname,
  })
}

export default defineConfig({
  webServer: {
    command: "npm run build && npm run preview",
    port: 4173,
  },
  testDir: "e2e",
})
